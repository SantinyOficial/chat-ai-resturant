import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, switchMap, catchError, of, combineLatest } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { PedidoService, Pedido, EstadoPedido } from './pedido.service';
import { PagoService, EstadoPagoPedido } from './pago.service';

export interface EstadoSincronizado {
  pedidoId: string;
  estadoPedido: EstadoPedido;
  estadoPago: EstadoPagoPedido;
  ultimaActualizacion: Date;
  mesa?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoSincronizacionService {
  private apiUrl = 'http://localhost:8080/api';

  // Estados centralizados
  private estadosSubject = new BehaviorSubject<{ [pedidoId: string]: EstadoSincronizado }>({});
  public estados$ = this.estadosSubject.asObservable();

  // Eventos de cambio
  private cambiosSubject = new BehaviorSubject<EstadoSincronizado | null>(null);
  public cambios$ = this.cambiosSubject.asObservable();

  // Control de polling
  private pollingInterval = 5000; // 5 segundos
  private isPollingActive = false;

  constructor(
    private http: HttpClient,
    private pedidoService: PedidoService,
    private pagoService: PagoService
  ) {
    this.inicializarSincronizacion();
  }
  private inicializarSincronizacion() {
    console.log('🔄 Inicializando servicio de sincronización de estados...');

    // Limpiar datos corruptos del localStorage
    this.limpiarDatosCorruptos();

    // Cargar estados previos desde localStorage
    this.cargarDesdeLocalStorage();

    // Suscribirse a cambios de pago del servicio existente
    this.pagoService.estadoPagoChanged$.subscribe(({ pedidoId, estadoPago }) => {
      this.actualizarEstadoPago(pedidoId, estadoPago);
    });

    // Iniciar polling automático
    this.iniciarPolling();
  }  /**
   * Limpiar datos corruptos del localStorage
   */
  private limpiarDatosCorruptos() {
    try {
      const ahora = new Date();

      // Limpiar estados sincronizados
      const estados = JSON.parse(localStorage.getItem('estados_sincronizados') || '{}');
      const estadosLimpios: { [pedidoId: string]: any } = {};
      let datosCorruptos = false;

      Object.keys(estados).forEach(pedidoId => {
        const estado = estados[pedidoId];

        // Verificar si el timestamp es válido y no es futuro
        if (estado.ultimaActualizacion) {
          const fecha = new Date(estado.ultimaActualizacion);
          if (isNaN(fecha.getTime()) || fecha.getFullYear() === 1970 || fecha > ahora) {
            console.warn(`⚠️ Timestamp corrupto/futuro detectado para pedido ${pedidoId}, corrigiendo...`);
            estado.ultimaActualizacion = new Date().toISOString();
            datosCorruptos = true;
          }
        } else {
          estado.ultimaActualizacion = new Date().toISOString();
          datosCorruptos = true;
        }

        estadosLimpios[pedidoId] = estado;
      });

      if (datosCorruptos) {
        localStorage.setItem('estados_sincronizados', JSON.stringify(estadosLimpios));
        console.log('🧹 Datos corruptos limpiados del localStorage');
      }

      // Verificar y limpiar timestamp de última verificación
      const ultimaVerificacion = localStorage.getItem('ultima_verificacion_estados');
      if (ultimaVerificacion) {
        const fecha = new Date(ultimaVerificacion);
        if (isNaN(fecha.getTime()) || fecha.getFullYear() === 1970 || fecha > ahora) {
          console.warn('⚠️ Timestamp de última verificación corrupto/futuro detectado, eliminando...');
          localStorage.removeItem('ultima_verificacion_estados');
        }
      }

    } catch (error) {
      console.error('❌ Error limpiando localStorage:', error);
      // Si hay error, limpiar completamente
      localStorage.removeItem('estados_sincronizados');
      localStorage.removeItem('ultima_verificacion_estados');
    }
  }

  /**
   * Actualizar estado de pago localmente y sincronizar
   */
  actualizarEstadoPago(pedidoId: string, estadoPago: EstadoPagoPedido) {
    console.log(`🔄 Sincronizando estado de pago: ${pedidoId} -> ${estadoPago}`);

    const estadosActuales = this.estadosSubject.value;
    const estadoActual = estadosActuales[pedidoId] || {
      pedidoId,
      estadoPedido: EstadoPedido.PENDIENTE,
      estadoPago: EstadoPagoPedido.PENDIENTE_PAGO,
      ultimaActualizacion: new Date()
    };

    const nuevoEstado: EstadoSincronizado = {
      ...estadoActual,
      estadoPago,
      ultimaActualizacion: new Date() // Asegurar fecha válida
    };

    // Actualizar estado local
    estadosActuales[pedidoId] = nuevoEstado;
    this.estadosSubject.next(estadosActuales);

    // Emitir cambio
    this.cambiosSubject.next(nuevoEstado);

    // Sincronizar con backend
    this.sincronizarConBackend(pedidoId, nuevoEstado);
  }

  /**
   * Actualizar estado de pedido
   */
  actualizarEstadoPedido(pedidoId: string, estadoPedido: EstadoPedido) {
    console.log(`🔄 Sincronizando estado de pedido: ${pedidoId} -> ${estadoPedido}`);

    const estadosActuales = this.estadosSubject.value;
    const estadoActual = estadosActuales[pedidoId] || {
      pedidoId,
      estadoPedido: EstadoPedido.PENDIENTE,
      estadoPago: EstadoPagoPedido.PENDIENTE_PAGO,
      ultimaActualizacion: new Date()
    };

    const nuevoEstado: EstadoSincronizado = {
      ...estadoActual,
      estadoPedido,
      ultimaActualizacion: new Date()
    };

    // Actualizar estado local
    estadosActuales[pedidoId] = nuevoEstado;
    this.estadosSubject.next(estadosActuales);

    // Emitir cambio
    this.cambiosSubject.next(nuevoEstado);

    // Sincronizar con backend
    this.sincronizarConBackend(pedidoId, nuevoEstado);
  }
  /**
   * Sincronizar estado específico con backend
   */
  private sincronizarConBackend(pedidoId: string, estado: EstadoSincronizado) {
    // Validar que el timestamp sea válido
    let fechaActualizacion = estado.ultimaActualizacion;

    if (!fechaActualizacion || fechaActualizacion.getTime() === 0 || fechaActualizacion.getFullYear() === 1970) {
      console.warn('⚠️ Timestamp inválido detectado, usando fecha actual');
      fechaActualizacion = new Date();
    }

    const payload = {
      pedidoId,
      estadoPedido: estado.estadoPedido,
      estadoPago: estado.estadoPago,
      ultimaActualizacion: fechaActualizacion.toISOString()
    };

    console.log('📤 Enviando payload al backend:', payload);

    this.http.put(`${this.apiUrl}/pedidos/${pedidoId}/estado-completo`, payload)
      .pipe(
        catchError(error => {
          console.error('❌ Error sincronizando con backend:', error);
          // Fallback: guardar en localStorage
          this.guardarEnLocalStorage(pedidoId, estado);
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          console.log('✅ Estado sincronizado con backend:', response);
        }
      });
  }

  /**
   * Guardar estado en localStorage como fallback
   */
  private guardarEnLocalStorage(pedidoId: string, estado: EstadoSincronizado) {
    const estados = JSON.parse(localStorage.getItem('estados_sincronizados') || '{}');
    estados[pedidoId] = estado;
    localStorage.setItem('estados_sincronizados', JSON.stringify(estados));

    // También actualizar en la estructura de pedidos existente
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex((p: any) => p.id === pedidoId);
    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].estado = estado.estadoPedido;
      pedidos[pedidoIndex].estadoPago = estado.estadoPago;
      pedidos[pedidoIndex].ultimaActualizacion = estado.ultimaActualizacion.toISOString();
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
    }
  }
  /**
   * Cargar estados desde localStorage
   */
  private cargarDesdeLocalStorage() {
    const estados = JSON.parse(localStorage.getItem('estados_sincronizados') || '{}');
    const estadosConvertidos: { [pedidoId: string]: EstadoSincronizado } = {};

    Object.keys(estados).forEach(pedidoId => {
      const estado = estados[pedidoId];

      // Validar y convertir timestamp
      let fechaActualizacion = new Date();
      if (estado.ultimaActualizacion) {
        const fecha = new Date(estado.ultimaActualizacion);
        if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
          fechaActualizacion = fecha;
        }
      }

      estadosConvertidos[pedidoId] = {
        ...estado,
        ultimaActualizacion: fechaActualizacion
      };
    });

    this.estadosSubject.next(estadosConvertidos);
  }

  /**
   * Iniciar polling automático para verificar cambios
   */
  iniciarPolling() {
    if (this.isPollingActive) return;

    console.log('🔄 Iniciando polling automático de estados...');
    this.isPollingActive = true;

    interval(this.pollingInterval)
      .pipe(
        switchMap(() => this.verificarCambiosEnBackend()),
        catchError(error => {
          console.error('❌ Error en polling:', error);
          return of([]);
        })
      )
      .subscribe(cambios => {
        if (cambios.length > 0) {
          console.log(`🔄 ${cambios.length} cambios detectados en polling`);
          cambios.forEach(cambio => this.procesarCambioDelBackend(cambio));
        }
      });
  }

  /**
   * Detener polling
   */
  detenerPolling() {
    this.isPollingActive = false;
    console.log('⏹️ Polling detenido');
  }  /**
   * Verificar cambios en el backend
   */
  private verificarCambiosEnBackend(): Observable<EstadoSincronizado[]> {
    // Obtener último timestamp válido o usar una fecha reciente
    let ultimaVerificacion = localStorage.getItem('ultima_verificacion_estados');

    // Si no existe o es inválido, usar fecha de hace 1 hora
    if (!ultimaVerificacion) {
      const unaHoraAtras = new Date(Date.now() - (60 * 60 * 1000));
      ultimaVerificacion = unaHoraAtras.toISOString();
      console.log('⚠️ No hay última verificación guardada, usando fecha de hace 1 hora:', ultimaVerificacion);
    } else {
      // Validar que el timestamp sea válido y no sea futuro
      const fecha = new Date(ultimaVerificacion);
      const ahora = new Date();

      if (isNaN(fecha.getTime()) || fecha.getFullYear() === 1970 || fecha > ahora) {
        const unaHoraAtras = new Date(Date.now() - (60 * 60 * 1000));
        ultimaVerificacion = unaHoraAtras.toISOString();
        console.warn('⚠️ Timestamp inválido/futuro detectado, corrigiendo con fecha de hace 1 hora:', ultimaVerificacion);
      }
    }

    console.log('🔍 Verificando cambios desde:', ultimaVerificacion);

    return this.http.get<any[]>(`${this.apiUrl}/pedidos/cambios-desde/${ultimaVerificacion}`)
      .pipe(
        switchMap(response => {
          // Actualizar timestamp de última verificación exitosa
          localStorage.setItem('ultima_verificacion_estados', new Date().toISOString());
          console.log('✅ Verificación exitosa, timestamp actualizado');
          return of(response);
        }),
        catchError(error => {
          console.error('❌ Error verificando cambios:', error);

          // Si es un error 400, probablemente el timestamp es problemático
          if (error.status === 400) {
            console.warn('⚠️ Error 400: timestamp problemático, reiniciando con fecha actual');
            localStorage.removeItem('ultima_verificacion_estados');

            // Reintentar inmediatamente con un timestamp válido
            const unaHoraAtras = new Date(Date.now() - (60 * 60 * 1000));
            const timestampValido = unaHoraAtras.toISOString();
            console.log('🔄 Reintentando con timestamp válido:', timestampValido);

            return this.http.get<any[]>(`${this.apiUrl}/pedidos/cambios-desde/${timestampValido}`)
              .pipe(
                switchMap(response => {
                  localStorage.setItem('ultima_verificacion_estados', new Date().toISOString());
                  return of(response);
                }),
                catchError(() => of([]))
              );
          }

          // Si hay error de conectividad, pausar el polling temporalmente
          if (error.status === 0 || error.status >= 500) {
            console.log('⏸️ Pausando polling por error de conectividad');
            setTimeout(() => {
              this.isPollingActive = false;
              setTimeout(() => this.iniciarPolling(), 30000); // Reintentar en 30 segundos
            }, 1000);
          }

          return of([]);
        })
      );
  }
  /**
   * Procesar cambio recibido del backend
   */
  private procesarCambioDelBackend(cambio: any) {
    // Validar y convertir timestamp
    let fechaActualizacion = new Date();
    if (cambio.ultimaActualizacion) {
      const fecha = new Date(cambio.ultimaActualizacion);
      if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
        fechaActualizacion = fecha;
      }
    }

    const estado: EstadoSincronizado = {
      pedidoId: cambio.pedidoId,
      estadoPedido: cambio.estadoPedido,
      estadoPago: cambio.estadoPago,
      ultimaActualizacion: fechaActualizacion,
      mesa: cambio.mesa
    };

    const estadosActuales = this.estadosSubject.value;
    estadosActuales[estado.pedidoId] = estado;
    this.estadosSubject.next(estadosActuales);

    // Emitir cambio
    this.cambiosSubject.next(estado);

    // Actualizar localStorage
    this.guardarEnLocalStorage(estado.pedidoId, estado);

    console.log('🔄 Estado actualizado desde backend:', estado);
  }

  /**
   * Obtener estado específico de un pedido
   */
  obtenerEstadoPedido(pedidoId: string): EstadoSincronizado | null {
    return this.estadosSubject.value[pedidoId] || null;
  }

  /**
   * Obtener todos los estados
   */
  obtenerTodosLosEstados(): { [pedidoId: string]: EstadoSincronizado } {
    return this.estadosSubject.value;
  }

  /**
   * Forzar sincronización completa
   */
  forzarSincronizacion(): Observable<boolean> {
    console.log('🔄 Forzando sincronización completa...');

    return combineLatest([
      this.pedidoService.getAllPedidos(),
      this.http.get<any[]>(`${this.apiUrl}/pedidos/estados-completos`)
    ]).pipe(      switchMap(([pedidosLocales, estadosBackend]) => {
        // Sincronizar estados
        const estadosActualizados: { [pedidoId: string]: EstadoSincronizado } = {};

        estadosBackend.forEach(estadoBackend => {
          // Validar y convertir timestamp
          let fechaActualizacion = new Date();
          if (estadoBackend.ultimaActualizacion) {
            const fecha = new Date(estadoBackend.ultimaActualizacion);
            if (!isNaN(fecha.getTime()) && fecha.getFullYear() > 1970) {
              fechaActualizacion = fecha;
            }
          }

          estadosActualizados[estadoBackend.pedidoId] = {
            pedidoId: estadoBackend.pedidoId,
            estadoPedido: estadoBackend.estadoPedido,
            estadoPago: estadoBackend.estadoPago,
            ultimaActualizacion: fechaActualizacion,
            mesa: estadoBackend.mesa
          };
        });

        this.estadosSubject.next(estadosActualizados);

        // Guardar en localStorage
        Object.values(estadosActualizados).forEach(estado => {
          this.guardarEnLocalStorage(estado.pedidoId, estado);
        });

        console.log('✅ Sincronización completa finalizada');
        return of(true);
      }),
      catchError(error => {
        console.error('❌ Error en sincronización completa:', error);
        // Cargar desde localStorage como fallback
        this.cargarDesdeLocalStorage();
        return of(false);
      })
    );
  }

  /**
   * Limpiar estados antiguos
   */
  limpiarEstadosAntiguos() {
    const ahora = new Date();
    const unDiaEnMs = 24 * 60 * 60 * 1000;
    const estadosActuales = this.estadosSubject.value;
    const estadosLimpios: { [pedidoId: string]: EstadoSincronizado } = {};

    Object.keys(estadosActuales).forEach(pedidoId => {
      const estado = estadosActuales[pedidoId];
      const tiempoTranscurrido = ahora.getTime() - estado.ultimaActualizacion.getTime();

      // Mantener solo estados de menos de 24 horas
      if (tiempoTranscurrido < unDiaEnMs) {
        estadosLimpios[pedidoId] = estado;
      }
    });

    this.estadosSubject.next(estadosLimpios);
    localStorage.setItem('estados_sincronizados', JSON.stringify(estadosLimpios));
  }

  /**
   * Método público para resetear timestamps problemáticos
   */
  public resetearTimestamps(): void {
    console.log('🔄 Reseteando timestamps problemáticos...');

    // Limpiar localStorage
    localStorage.removeItem('ultima_verificacion_estados');
    localStorage.removeItem('estados_sincronizados');

    // Limpiar estado en memoria
    this.estadosSubject.next({});

    // Recargar desde localStorage (que ahora estará limpio)
    this.cargarDesdeLocalStorage();

    console.log('✅ Timestamps reseteados correctamente');
  }

  /**
   * Verificar el estado actual de los timestamps
   */
  public verificarTimestamps(): { ultimaVerificacion: string | null, valido: boolean } {
    const ultimaVerificacion = localStorage.getItem('ultima_verificacion_estados');
    let valido = true;

    if (ultimaVerificacion) {
      const fecha = new Date(ultimaVerificacion);
      const ahora = new Date();
      valido = !isNaN(fecha.getTime()) && fecha.getFullYear() !== 1970 && fecha <= ahora;
    }

    return {
      ultimaVerificacion,
      valido
    };
  }
}
