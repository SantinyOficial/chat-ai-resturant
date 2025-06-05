import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  NEQUI = 'NEQUI',
  PSE = 'PSE',
  DAVIPLATA = 'DAVIPLATA'
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO',
  REEMBOLSADO = 'REEMBOLSADO'
}

// Nuevo enum para el estado de pago del pedido
export enum EstadoPagoPedido {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PROCESANDO_PAGO = 'PROCESANDO_PAGO',
  PAGO_REALIZADO = 'PAGO_REALIZADO',
  PAGO_FALLIDO = 'PAGO_FALLIDO'
}

// Interface para pedidos con estado de pago
export interface PedidoConPago {
  id: string;
  mesa: number;
  items: any[];
  total: number;
  estado: string;
  estadoPago: EstadoPagoPedido;
  fechaCreacion: Date;
  clienteId: string;
  pagoId?: string;
}

export interface DatosTarjeta {
  numeroTarjeta: string;
  nombreTarjeta: string;
  mesExpiracion: number;
  anoExpiracion: number;
  cvv: string;
}

export interface DatosNequi {
  telefono: string;
  codigoVerificacion?: string;
}

export interface DatosPSE {
  banco: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
}

export interface DatosDaviplata {
  telefono: string;
  pin?: string;
}

export interface Pago {
  id?: string;
  pedidoId: string;
  clienteId: string;
  metodoPago: MetodoPago;
  monto: number;
  estado: EstadoPago;
  fechaCreacion?: string;
  fechaProcesamiento?: string;
  descripcion?: string;
  observaciones?: string;
  codigoTransaccion?: string;

  // Datos específicos del método de pago
  numeroTarjeta?: string;
  nombreTarjeta?: string;
  mesExpiracion?: number;
  anoExpiracion?: number;
  cvv?: string;
  telefonoNequi?: string;
  bancoPSE?: string;
  tipoDocumentoPSE?: string;
  numeroDocumentoPSE?: string;
  emailPSE?: string;
  telefonoDaviplata?: string;
  pinDaviplata?: string;

  // Información adicional
  comisionBanco?: number;
  montoTotal?: number;
  referenciaPago?: string;
  urlComprobante?: string;
}

export interface MetodoPagoDisponible {
  metodo: MetodoPago;
  nombre: string;
  descripcion: string;
  comision: number;
  montoMinimo: number;
  montoMaximo: number;
  disponible: boolean;
  icono?: string;
}

export interface ResultadoPago {
  success: boolean;
  pago?: Pago;
  mensaje: string;
  codigoTransaccion?: string;
  urlComprobante?: string;
  qrCode?: string; // Para pagos digitales
}

export interface CodigoQR {
  codigo: string;
  imagen: string; // Base64
  validoHasta: string;
  monto: number;
  referencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = '/api/pagos';

  constructor(private http: HttpClient) {}

  // Subject para notificar cambios de estado de pago
  private estadoPagoChanged = new Subject<{pedidoId: string, estadoPago: EstadoPagoPedido}>();
  public estadoPagoChanged$ = this.estadoPagoChanged.asObservable();

  // ===== MÉTODOS PARA MVP - SIMULACIÓN DE PAGOS =====
  // Simular procesamiento de pago para MVP
  simularPagoPedido(pedidoId: string, monto: number, metodoPago: MetodoPago): Observable<ResultadoPago> {
    return new Observable(observer => {
      console.log(`🔄 Iniciando simulación de pago para pedido ${pedidoId} - Monto: $${monto} - Método: ${metodoPago}`);

      // Actualizar estado a procesando INMEDIATAMENTE
      this.actualizarEstadoPagoPedido(pedidoId, EstadoPagoPedido.PROCESANDO_PAGO);

      // Simular delay de procesamiento realista con feedback
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        console.log(`📊 Progreso del pago: ${progress}%`);

        if (progress >= 100) {
          clearInterval(progressInterval);

          // 95% de éxito para demo (solo 5% de fallos)
          const exitoso = Math.random() > 0.05;

          if (exitoso) {
            const pagoSimulado: Pago = {
              id: 'PAG-' + Date.now(),
              pedidoId: pedidoId,
              clienteId: 'MVP-CLIENT',
              monto: monto,
              metodoPago: metodoPago,
              estado: EstadoPago.APROBADO,
              fechaCreacion: new Date().toISOString(),
              fechaProcesamiento: new Date().toISOString(),
              descripcion: `Pago simulado - ${this.getMetodoLabel(metodoPago)}`,
              codigoTransaccion: 'TXN-' + Math.floor(Math.random() * 1000000),
              referenciaPago: 'REF-' + Math.floor(Math.random() * 100000)
            };

            // Guardar pago en localStorage
            this.guardarPagoSimulado(pagoSimulado);

            // Actualizar estado del pedido
            this.actualizarEstadoPagoPedido(pedidoId, EstadoPagoPedido.PAGO_REALIZADO);

            console.log('✅ Pago procesado exitosamente:', pagoSimulado);

            observer.next({
              success: true,
              mensaje: 'Pago procesado exitosamente',
              pago: pagoSimulado,
              codigoTransaccion: pagoSimulado.codigoTransaccion
            });
          } else {
            console.log('❌ Pago falló en la simulación');

            this.actualizarEstadoPagoPedido(pedidoId, EstadoPagoPedido.PAGO_FALLIDO);

            observer.next({
              success: false,
              mensaje: 'El pago no pudo ser procesado. Verifique sus datos e intente nuevamente.',
              pago: undefined
            });
          }

          observer.complete();
        }
      }, 300); // Actualizar progreso cada 300ms
    });
  }

  // Actualizar estado de pago del pedido
  private actualizarEstadoPagoPedido(pedidoId: string, estadoPago: EstadoPagoPedido): void {
    // Actualizar en localStorage
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex((p: any) => p.id === pedidoId);

    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].estadoPago = estadoPago;
      if (estadoPago === EstadoPagoPedido.PAGO_REALIZADO) {
        pedidos[pedidoIndex].fechaPago = new Date().toISOString();
      }
      localStorage.setItem('pedidos', JSON.stringify(pedidos));
    }
    // Notificar cambio a otros componentes siempre
    this.estadoPagoChanged.next({ pedidoId, estadoPago });
  }

  // Guardar pago simulado en localStorage
  private guardarPagoSimulado(pago: Pago): void {
    const pagos = JSON.parse(localStorage.getItem('pagos_mvp') || '[]');
    pagos.push(pago);
    localStorage.setItem('pagos_mvp', JSON.stringify(pagos));
  }

  // Obtener historial de pagos simulados
  getHistorialPagosSimulados(): Observable<Pago[]> {
    return new Observable(observer => {
      const pagos = JSON.parse(localStorage.getItem('pagos_mvp') || '[]');
      observer.next(pagos);
      observer.complete();
    });
  }

  // Obtener estado de pago de un pedido
  getEstadoPagoPedido(pedidoId: string): EstadoPagoPedido {
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedido = pedidos.find((p: any) => p.id === pedidoId);
    return pedido?.estadoPago || EstadoPagoPedido.PENDIENTE_PAGO;
  }

  // Método auxiliar para obtener label del método de pago
  private getMetodoLabel(metodo: MetodoPago): string {
    const labels = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.TARJETA_CREDITO]: 'Tarjeta de Crédito',
      [MetodoPago.TARJETA_DEBITO]: 'Tarjeta de Débito',
      [MetodoPago.NEQUI]: 'Nequi',
      [MetodoPago.PSE]: 'PSE',
      [MetodoPago.DAVIPLATA]: 'Daviplata'
    };
    return labels[metodo] || metodo;
  }

  // Obtener estadísticas de pagos simulados
  getEstadisticasPagos(): Observable<any> {
    return new Observable(observer => {
      const pagos: Pago[] = JSON.parse(localStorage.getItem('pagos_mvp') || '[]');

      const estadisticas = {
        totalPagos: pagos.length,
        montoTotal: pagos.reduce((total, pago) => total + pago.monto, 0),
        pagosAprobados: pagos.filter(p => p.estado === EstadoPago.APROBADO).length,
        pagosRechazados: pagos.filter(p => p.estado === EstadoPago.RECHAZADO).length,
        tasaExito: pagos.length > 0 ? Math.round((pagos.filter(p => p.estado === EstadoPago.APROBADO).length / pagos.length) * 100) : 0,
        metodosPorUso: this.calcularMetodosPorUso(pagos)
      };

      observer.next(estadisticas);
      observer.complete();
    });
  }

  private calcularMetodosPorUso(pagos: Pago[]) {
    const metodoCount = new Map<MetodoPago, number>();
    pagos.forEach(pago => {
      metodoCount.set(pago.metodoPago, (metodoCount.get(pago.metodoPago) || 0) + 1);
    });

    return Array.from(metodoCount.entries())
      .map(([metodo, cantidad]) => ({ metodo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad);
  }

  // Obtener métodos de pago disponibles
  getMetodosPagoDisponibles(): Observable<MetodoPagoDisponible[]> {
    return this.http.get<MetodoPagoDisponible[]>(`${this.apiUrl}/metodos-disponibles`);
  }

  // Procesar pago
  procesarPago(pago: Pago): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar`, pago);
  }

  // Procesar pago con tarjeta
  procesarPagoTarjeta(pedidoId: string, monto: number, datosTarjeta: DatosTarjeta): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: datosTarjeta.numeroTarjeta.startsWith('4') ? MetodoPago.TARJETA_CREDITO : MetodoPago.TARJETA_DEBITO,
      numeroTarjeta: datosTarjeta.numeroTarjeta,
      nombreTarjeta: datosTarjeta.nombreTarjeta,
      mesExpiracion: datosTarjeta.mesExpiracion,
      anoExpiracion: datosTarjeta.anoExpiracion,
      cvv: datosTarjeta.cvv
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-tarjeta`, pago);
  }

  // Procesar pago con Nequi
  procesarPagoNequi(pedidoId: string, monto: number, datosNequi: DatosNequi): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.NEQUI,
      telefonoNequi: datosNequi.telefono
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-nequi`, pago);
  }

  // Procesar pago con PSE
  procesarPagoPSE(pedidoId: string, monto: number, datosPSE: DatosPSE): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.PSE,
      bancoPSE: datosPSE.banco,
      tipoDocumentoPSE: datosPSE.tipoDocumento,
      numeroDocumentoPSE: datosPSE.numeroDocumento,
      emailPSE: datosPSE.email
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-pse`, pago);
  }

  // Procesar pago con Daviplata
  procesarPagoDaviplata(pedidoId: string, monto: number, datosDaviplata: DatosDaviplata): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.DAVIPLATA,
      telefonoDaviplata: datosDaviplata.telefono,
      pinDaviplata: datosDaviplata.pin
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-daviplata`, pago);
  }

  // Procesar pago en efectivo
  procesarPagoEfectivo(pedidoId: string, monto: number, observaciones?: string): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.EFECTIVO,
      observaciones
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-efectivo`, pago);
  }

  // Generar código QR para pago
  generarCodigoQR(pedidoId: string, metodoPago: MetodoPago): Observable<CodigoQR> {
    return this.http.post<CodigoQR>(`${this.apiUrl}/generar-qr`, {
      pedidoId,
      metodoPago
    });
  }

  // Verificar estado de pago
  verificarEstadoPago(pagoId: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${pagoId}/estado`);
  }

  // Obtener pago por ID
  getPagoById(pagoId: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${pagoId}`);
  }

  // Obtener pagos por pedido
  getPagosByPedido(pedidoId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/pedido/${pedidoId}`);
  }

  // Obtener pagos por cliente
  getPagosByCliente(clienteId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Obtener historial de pagos
  getHistorialPagos(clienteId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/historial/${clienteId}`);
  }

  // Cancelar pago
  cancelarPago(pagoId: string, motivo?: string): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/${pagoId}/cancelar`, {
      motivo
    });
  }

  // Procesar reembolso
  procesarReembolso(pagoId: string, monto?: number, motivo?: string): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/${pagoId}/reembolso`, {
      monto,
      motivo
    });
  }

  // Validar datos de tarjeta
  validarDatosTarjeta(datosTarjeta: DatosTarjeta): Observable<{valido: boolean, errores?: string[]}> {
    return this.http.post<{valido: boolean, errores?: string[]}>(`${this.apiUrl}/validar-tarjeta`, datosTarjeta);
  }

  // Validar número de teléfono para Nequi/Daviplata
  validarTelefono(telefono: string, metodo: MetodoPago): Observable<{valido: boolean, mensaje?: string}> {
    return this.http.post<{valido: boolean, mensaje?: string}>(`${this.apiUrl}/validar-telefono`, {
      telefono,
      metodo
    });
  }

  // Obtener bancos disponibles para PSE
  getBancosDisponibles(): Observable<{codigo: string, nombre: string}[]> {
    return this.http.get<{codigo: string, nombre: string}[]>(`${this.apiUrl}/bancos-pse`);
  }

  // Consultar comisión por método de pago
  consultarComision(metodoPago: MetodoPago, monto: number): Observable<{comision: number, total: number}> {
    return this.http.get<{comision: number, total: number}>(`${this.apiUrl}/comision`, {
      params: {
        metodoPago: metodoPago.toString(),
        monto: monto.toString()
      }
    });
  }

  // Consultar pago por código de transacción
  consultarPago(codigoTransaccion: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/consultar/${codigoTransaccion}`);
  }

  // Descargar comprobante de pago
  descargarComprobante(pagoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${pagoId}/comprobante`, {
      responseType: 'blob'
    });
  }
}
