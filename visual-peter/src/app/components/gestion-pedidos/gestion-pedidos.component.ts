import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';
import { PagoService } from '../../services/pago.service';
import { EstadoPagoPedido } from '../../models/enums';
import { VoiceService } from '../../services/voice.service';
import { EstadoSincronizacionService, EstadoSincronizado } from '../../services/estado-sincronizacion.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion-pedidos.component.html',
  styleUrls: ['./gestion-pedidos.component.scss']
})
export class GestionPedidosComponent implements OnInit, OnDestroy {
  allPedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  selectedFilter: string = 'all';
  estadosPago: { [pedidoId: string]: EstadoPagoPedido } = {};
  estadosSincronizados: { [pedidoId: string]: EstadoSincronizado } = {};
  private subscription?: Subscription;
  private estadosSubscription?: Subscription;
  // Nuevas propiedades para notificaciones
  pedidosConPagoCompletado: Pedido[] = [];
  ultimoSonidoNotificacion: Date | null = null;
  notificacionesActivas: { [pedidoId: string]: boolean } = {};  // Control de anuncios duplicados
  private anunciosRealizados: { [key: string]: Date } = {};
  private tiempoMinimoEntreAnuncios = 15000; // 15 segundos entre anuncios del mismo tipo
  private anunciosPendientes: { [pedidoId: string]: number } = {};
  // Control de notificaciones del mesero para evitar duplicados
  private notificacionesMeseroMostradas: Set<string> = new Set();
  private ultimaRevisionNotificaciones: Date | null = null;

  // Referencias de intervalos para limpieza
  private intervalLimpiezaAnuncios?: number;
  private intervalLimpiezaNotificaciones?: number;

  // Referencias de enums para usar en template
  EstadoPedido = EstadoPedido;
  EstadoPagoPedido = EstadoPagoPedido;
  constructor(
    private pedidoService: PedidoService,
    private pagoService: PagoService,
    private voiceService: VoiceService,
    @Inject(EstadoSincronizacionService) private estadoSincronizacionService: EstadoSincronizacionService  ) {}  ngOnInit() {
    console.log('🚀 Inicializando componente de gestión de pedidos...');

    // Registrar referencia global para recarga forzada
    (window as any).gestionPedidosComponent = this;

    // Cargar estados persistentes de pago al inicializar
    this.cargarEstadosPagosPersistentes();

    // 🔄 CARGAR TODOS LOS PAGOS COMPLETADOS (INCLUYENDO EMERGENCIAS)
    this.cargarTodosPagosCompletados();

    // 🔔 CARGAR NOTIFICACIONES DE PAGOS COMPLETADOS
    this.cargarNotificacionesMesero();

    // ⚡ ESCUCHAR EVENTOS GLOBALES DE PAGO COMPLETADO (INMEDIATOS)
    window.addEventListener('pagoCompletadoInmediato', (event: any) => {
      console.log('⚡ 🔔 EVENTO INMEDIATO DE PAGO COMPLETADO RECIBIDO:', event.detail);
      this.procesarPagoCompletadoInmediato(event.detail);
    });

    // 🔄 ESCUCHAR EVENTOS DE RECARGA FORZADA
    window.addEventListener('forzarRecargaPedidos', (event: any) => {
      console.log('🔄 ⚡ EVENTO DE RECARGA FORZADA RECIBIDO:', event.detail);
      this.ejecutarRecargaForzada();
    });

    // 🎧 ESCUCHAR EVENTOS GLOBALES DE PAGO COMPLETADO (ORIGINALES)
    window.addEventListener('pagoCompletado', (event: any) => {
      console.log('🔔 Evento de pago completado recibido:', event.detail);
      this.procesarPagoCompletado(event.detail);
    });    this.loadPedidos();

    // Programar limpieza periódica de anuncios antiguos
    this.intervalLimpiezaAnuncios = window.setInterval(() => {
      this.limpiarAnunciosAntiguos();
    }, 30000); // Cada 30 segundos    // Programar limpieza periódica de notificaciones del mesero
    this.intervalLimpiezaNotificaciones = window.setInterval(() => {
      this.limpiarNotificacionesMeseroMostradas();
    }, 60000); // Cada 60 segundos

    // Programar limpieza periódica de notificaciones del mesero mostradas
    // (Comentado - duplicado, ya está arriba)
    // setInterval(() => {
    //   this.limpiarNotificacionesMeseroMostradas();
    // }, 60000); // Cada 60 segundos

    // Suscribirse al servicio de sincronización centralizado
    this.estadosSubscription = this.estadoSincronizacionService.cambios$.subscribe(estados => {
      // Procesar cada estado en el array
      estados.forEach(cambio => {
        if (cambio) {
          console.log('🔄 Cambio de estado recibido en gestión de pedidos:', cambio);

          // Actualizar estados locales INMEDIATAMENTE
          this.estadosSincronizados[cambio.pedidoId] = cambio;
          this.estadosPago[cambio.pedidoId] = cambio.estadoPago;

          // Encontrar y actualizar el pedido correspondiente
          const pedidoIndex = this.allPedidos.findIndex(p => p.id === cambio.pedidoId);
          if (pedidoIndex !== -1) {
            this.allPedidos[pedidoIndex].estado = cambio.estadoPedido;
            console.log(`✅ Pedido ${cambio.pedidoId} actualizado en lista local - Estado: ${cambio.estadoPedido}, Pago: ${cambio.estadoPago}`);

            // Re-aplicar filtros para refrescar la vista
            this.applyFilter(this.selectedFilter);
          } else {            console.log(`⚠️ Pedido ${cambio.pedidoId} no encontrado en lista local, recargando pedidos...`);
            // Si el pedido no existe localmente, recargar todos los pedidos
            window.setTimeout(() => {
              this.loadPedidos();
            }, 1000);
          }

          // Anuncios por voz mejorados
          this.manejarAnunciosPorVoz(cambio);
        }
      });
    });    // También mantener la suscripción original como respaldo
    this.subscription = this.pagoService.estadoPagoChanged$.subscribe((cambio: any) => {
      const { pedidoId, estadoPago } = cambio;
      console.log(`🔄 Estado de pago actualizado (servicio original): Pedido ${pedidoId} -> ${estadoPago}`);

      // Actualizar estado local inmediatamente
      this.estadosPago[pedidoId] = estadoPago;

      // Actualizar en el servicio de sincronización
      this.estadoSincronizacionService.actualizarEstadoPago(pedidoId, estadoPago);
    });

    // Forzar sincronización inicial
    this.estadoSincronizacionService.forzarSincronizacion().subscribe(exito => {
      if (exito) {
        console.log('✅ Sincronización inicial completada en gestión de pedidos');
        this.loadPedidos(); // Recargar después de la sincronización
      }
    });
  }  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.estadosSubscription) {
      this.estadosSubscription.unsubscribe();
    }

    // Limpiar intervalos de limpieza
    if (this.intervalLimpiezaAnuncios) {
      clearInterval(this.intervalLimpiezaAnuncios);
    }
    if (this.intervalLimpiezaNotificaciones) {
      clearInterval(this.intervalLimpiezaNotificaciones);
    }

    // Cancelar todos los anuncios pendientes
    Object.keys(this.anunciosPendientes).forEach(pedidoId => {
      this.cancelarAnuncioPendiente(pedidoId);
    });

    // Limpiar notificaciones del mesero mostradas
    this.notificacionesMeseroMostradas.clear();

    // Limpiar referencia global
    if ((window as any).gestionPedidosComponent === this) {
      delete (window as any).gestionPedidosComponent;
    }

    // Remover event listeners
    window.removeEventListener('pagoCompletadoInmediato', this.procesarPagoCompletadoInmediato);
    window.removeEventListener('forzarRecargaPedidos', this.ejecutarRecargaForzada);
    window.removeEventListener('pagoCompletado', this.procesarPagoCompletado);
  }
  loadPedidos() {
    console.log('🔄 Cargando todos los pedidos...');

    // NUEVA ESTRATEGIA: Cargar primero desde localStorage, luego intentar sincronizar con backend
    this.cargarPedidosDesdeLocalStorage();

    // Intentar sincronizar con backend en segundo plano (sin bloquear la interfaz)
    this.intentarSincronizacionBackend();
  }

  /**
   * NUEVA FUNCIÓN: Cargar pedidos desde localStorage como fuente principal
   */
  private cargarPedidosDesdeLocalStorage() {
    console.log('💾 Cargando pedidos desde localStorage...');

    try {
      const pedidosString = localStorage.getItem('pedidos');
      if (pedidosString) {
        const pedidos = JSON.parse(pedidosString);

        // Convertir los pedidos del localStorage al formato esperado
        this.allPedidos = pedidos.map((p: any) => ({
          id: p.id,
          clienteNombre: p.clienteNombre || p.clienteId || 'Cliente',
          clienteId: p.clienteId,
          mesa: p.mesa,
          items: p.items || [],
          total: p.total,
          estado: p.estado || EstadoPedido.PENDIENTE,
          fechaCreacion: p.fechaCreacion,
          fechaActualizacion: p.fechaActualizacion,
          observaciones: p.observaciones,
          tipoPedido: p.tipoPedido,
          telefono: p.telefono,
          direccion: p.direccion,
          barrio: p.barrio,
          referencia: p.referencia
        }));

        console.log(`✅ ${this.allPedidos.length} pedidos cargados desde localStorage`);

        // Cargar estados de pago después de cargar pedidos
        this.sincronizarEstadosPago();

        // Actualizar pedidos con pago completado para notificaciones
        this.actualizarPedidosConPagoCompletado();

        this.applyFilter(this.selectedFilter);

        console.log('📊 Estados de pedidos:', this.allPedidos.map(p => `${p.id?.substring(0, 6)}: ${p.estado}`));

        // Verificar estados de pago para cada pedido
        this.allPedidos.forEach(pedido => {
          if (pedido.id) {
            const estadoPago = this.getEstadoPago(pedido.id);
            console.log(`💰 Pedido ${pedido.id?.substring(0, 8)} - Estado: ${pedido.estado} - Pago: ${estadoPago}`);
          }
        });

      } else {
        console.log('📋 No hay pedidos en localStorage');
        this.allPedidos = [];
        this.applyFilter(this.selectedFilter);
      }
    } catch (error) {
      console.error('❌ Error cargando pedidos desde localStorage:', error);
      this.allPedidos = [];
      this.applyFilter(this.selectedFilter);
    }
  }

  /**
   * NUEVA FUNCIÓN: Intentar sincronización con backend en segundo plano
   */
  private intentarSincronizacionBackend() {
    console.log('🌐 Intentando sincronización con backend...');

    this.pedidoService.getAllPedidos().subscribe({
      next: (pedidos) => {
        console.log('✅ Sincronización con backend exitosa');

        // Comparar y actualizar solo si hay diferencias significativas
        if (this.hayDiferenciasSignificativas(pedidos)) {
          console.log('🔄 Actualizando pedidos con datos del backend...');
          this.allPedidos = pedidos;
          this.applyFilter(this.selectedFilter);
        }
      },
      error: (err) => {
        console.warn('⚠️ No se puede conectar al backend, continuando con datos locales:', err.message);
        // No hacer nada - ya tenemos los datos del localStorage
      }
    });
  }

  /**
   * NUEVA FUNCIÓN: Verificar si hay diferencias significativas entre datos locales y del backend
   */
  private hayDiferenciasSignificativas(pedidosBackend: Pedido[]): boolean {
    if (this.allPedidos.length !== pedidosBackend.length) {
      return true;
    }

    // Verificar si algún pedido tiene un estado diferente
    return pedidosBackend.some(pedidoBackend => {
      const pedidoLocal = this.allPedidos.find(p => p.id === pedidoBackend.id);
      return !pedidoLocal || pedidoLocal.estado !== pedidoBackend.estado;
    });
  }

  /**
   * Actualizar lista de pedidos con pago completado para notificaciones
   */
  private actualizarPedidosConPagoCompletado() {
    this.pedidosConPagoCompletado = this.allPedidos.filter(pedido =>
      pedido.id && this.puedeAceptarPedido(pedido)
    );

    // Si hay nuevos pagos completados, activar notificaciones
    if (this.pedidosConPagoCompletado.length > 0) {
      this.activarNotificacionesPagoCompletado();
    }

    console.log(`🔔 ${this.pedidosConPagoCompletado.length} pedidos con pago completado pendientes de aceptación`);
  }

  /**
   * Activar notificaciones para pagos completados
   */
  private activarNotificacionesPagoCompletado() {
    const ahora = new Date();

    // Evitar reproducir sonidos muy frecuentemente
    if (!this.ultimoSonidoNotificacion ||
        (ahora.getTime() - this.ultimoSonidoNotificacion.getTime()) > 10000) {

      // Reproducir sonido de notificación si hay soporte de voz
      if (this.voiceService.soporteVoz) {
        const mensaje = `Atención: ${this.pedidosConPagoCompletado.length} pedido${this.pedidosConPagoCompletado.length > 1 ? 's' : ''} con pago completado esperando aceptación`;
        this.voiceService.hablar(mensaje);
      }

      this.ultimoSonidoNotificacion = ahora;
    }

    // Marcar notificaciones como activas
    this.pedidosConPagoCompletado.forEach(pedido => {
      if (pedido.id) {
        this.notificacionesActivas[pedido.id] = true;
      }
    });
  }

  /**
   * Aceptar todos los pedidos con pago completado
   */
  aceptarTodosPagosCompletados() {
    console.log(`🍽️ Aceptando ${this.pedidosConPagoCompletado.length} pedidos con pago completado...`);

    this.pedidosConPagoCompletado.forEach(pedido => {
      this.aceptarPedido(pedido);
    });

    // Limpiar notificaciones
    this.pedidosConPagoCompletado = [];
    this.notificacionesActivas = {};
  }

  /**
   * Cargar estados de pago persistentes desde localStorage
   */
  private cargarEstadosPagosPersistentes() {
    console.log('🔍 Cargando estados de pago persistentes...');

    try {
      // Cargar desde el almacenamiento separado de estados de pago
      const estadosPago = JSON.parse(localStorage.getItem('estados_pago_pedidos') || '{}');
      Object.entries(estadosPago).forEach(([pedidoId, estado]: [string, any]) => {
        this.estadosPago[pedidoId] = estado.estadoPago;
        console.log(`💾 Estado de pago cargado para ${pedidoId}: ${estado.estadoPago}`);
      });

      // Cargar desde localStorage de pedidos como respaldo
      const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
      pedidos.forEach((pedido: any) => {
        if (pedido.estadoPago && !this.estadosPago[pedido.id]) {
          this.estadosPago[pedido.id] = pedido.estadoPago;
          console.log(`💾 Estado de pago cargado desde pedidos para ${pedido.id}: ${pedido.estadoPago}`);
        }
      });

      console.log('✅ Estados de pago persistentes cargados:', this.estadosPago);
    } catch (error) {
      console.error('❌ Error cargando estados de pago persistentes:', error);
    }
  }

  /**
   * Sincronizar estados de pago con pedidos cargados
   */
  private sincronizarEstadosPago() {
    console.log('🔄 Sincronizando estados de pago con pedidos cargados...');

    this.allPedidos.forEach(pedido => {
      if (pedido.id) {
        // Obtener estado de pago desde el servicio
        const estadoPagoService = this.pagoService.getEstadoPagoPedido(pedido.id);

        // Si no tenemos el estado localmente o es diferente, actualizarlo
        if (!this.estadosPago[pedido.id] || this.estadosPago[pedido.id] !== estadoPagoService) {
          this.estadosPago[pedido.id] = estadoPagoService;
          console.log(`🔄 Estado de pago sincronizado para ${pedido.id}: ${estadoPagoService}`);

          // Actualizar en el servicio de sincronización también
          if (estadoPagoService !== EstadoPagoPedido.PENDIENTE_PAGO) {
            this.estadoSincronizacionService.actualizarEstadoPago(pedido.id, estadoPagoService);
          }
        }
      }
    });
  }

  filterPedidos(filter: string) {
    this.selectedFilter = filter;
    this.applyFilter(filter);
  }

  applyFilter(filter: string) {
    if (filter === 'all') {
      this.filteredPedidos = [...this.allPedidos];
    } else {
      this.filteredPedidos = this.allPedidos.filter(
        pedido => pedido.estado === filter
      );
    }

    // Ordenar los pedidos por fecha, con los más recientes primero
    this.filteredPedidos.sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
      return dateB - dateA;
    });
  }

  changeStatus(pedido: Pedido, nuevoEstado: string) {
    const estadoPedido = nuevoEstado as EstadoPedido;
    console.log(`🔄 Cambiando estado del pedido ${pedido.id} de ${pedido.estado} a ${estadoPedido}`);

    this.pedidoService.actualizarEstadoPedido(pedido.id!, estadoPedido).subscribe({
      next: (pedidoActualizado) => {
        console.log('✅ Estado del pedido actualizado exitosamente:', pedidoActualizado);

        // Actualizar el pedido en las listas locales
        const index = this.allPedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          this.allPedidos[index] = pedidoActualizado;
        }

        // Sincronizar con el servicio de estados
        this.estadoSincronizacionService.actualizarEstadoPedido(pedido.id!, estadoPedido);

        // Volver a aplicar el filtro para actualizar la vista
        this.applyFilter(this.selectedFilter);

        // Log específico para estados importantes
        if (estadoPedido === EstadoPedido.LISTO) {
          console.log(`🍽️ Pedido ${pedido.id} está listo para entregar en mesa ${pedido.mesa}`);
        } else if (estadoPedido === EstadoPedido.ENTREGADO) {
          console.log(`✅ Pedido ${pedido.id} entregado exitosamente en mesa ${pedido.mesa}`);
        }
      },
      error: (err) => {
        console.error('❌ Error al actualizar el estado del pedido:', err);
        console.error('Detalles:', {
          pedidoId: pedido.id,
          estadoAnterior: pedido.estado,
          estadoNuevo: estadoPedido,
          mesa: pedido.mesa
        });
      }
    });
  }

  // Obtener estado de pago para un pedido
  getEstadoPago(pedidoId: string): EstadoPagoPedido {
    return this.estadosPago[pedidoId] || EstadoPagoPedido.PENDIENTE_PAGO;
  }

  // Obtener label del estado de pago
  getEstadoPagoLabel(estadoPago: EstadoPagoPedido): string {
    const labels = {
      [EstadoPagoPedido.PENDIENTE_PAGO]: 'Pendiente de Pago',
      [EstadoPagoPedido.PROCESANDO_PAGO]: 'Procesando Pago',
      [EstadoPagoPedido.PAGO_REALIZADO]: 'Pago Completado',
      [EstadoPagoPedido.PAGO_FALLIDO]: 'Pago Fallido'
    };
    return labels[estadoPago] || estadoPago;
  }

  // Verificar si un pedido puede ser aceptado (pago completado)
  puedeAceptarPedido(pedido: Pedido): boolean {
    if (!pedido.id) return false;
    const estadoPago = this.getEstadoPago(pedido.id);
    return estadoPago === EstadoPagoPedido.PAGO_REALIZADO &&
           pedido.estado === EstadoPedido.PENDIENTE;
  }

  // Aceptar pedido y enviarlo a cocina
  aceptarPedido(pedido: Pedido) {
    if (!this.puedeAceptarPedido(pedido)) {
      console.warn('⚠️ No se puede aceptar el pedido. Verificar estado de pago.');
      console.log('Estado actual del pedido:', pedido.estado);
      console.log('Estado de pago actual:', this.getEstadoPago(pedido.id!));
      return;
    }

    console.log(`🍽️ Aceptando pedido ${pedido.id} para mesa ${pedido.mesa}...`);

    this.pedidoService.actualizarEstadoPedido(pedido.id!, EstadoPedido.EN_PREPARACION).subscribe({
      next: (pedidoActualizado) => {
        console.log('✅ Pedido aceptado y enviado a cocina:', pedidoActualizado);

        // Actualizar el pedido en la lista local inmediatamente
        const index = this.allPedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          this.allPedidos[index] = pedidoActualizado;
        }

        // Actualizar en el servicio de sincronización
        this.estadoSincronizacionService.actualizarEstadoPedido(
          pedido.id!,
          EstadoPedido.EN_PREPARACION
        );

        // Recargar para asegurar consistencia
        this.loadPedidos();        console.log(`🎉 Pedido ${pedido.id} de mesa ${pedido.mesa} enviado a cocina exitosamente`);

        // 🔔 Marcar notificación como leída
        this.marcarNotificacionComoLeida(pedido.id!);

        // ✅ MEJORA: No mostrar alerta adicional, la interfaz ya muestra el cambio de estado visualmente
        console.log('ℹ️ Pedido aceptado correctamente. El cambio se refleja en la interfaz visual.');
      },
      error: (error: any) => {
        console.error('❌ Error al aceptar pedido:', error);
        console.error('Detalles del error:', {
          pedidoId: pedido.id,
          mesa: pedido.mesa,
          estadoActual: pedido.estado,
          estadoPago: this.getEstadoPago(pedido.id!)
        });
      }
    });
  }  getEstadoLabel(estado: EstadoPedido): string {
    const labels = {
      [EstadoPedido.PENDIENTE]: 'Pendiente',
      [EstadoPedido.CONFIRMADO]: 'Confirmado',
      [EstadoPedido.EN_PREPARACION]: 'En Preparación',
      [EstadoPedido.LISTO]: 'Listo para Entregar',
      [EstadoPedido.EN_CAMINO]: 'En Camino',
      [EstadoPedido.ENTREGADO]: 'Entregado',
      [EstadoPedido.CANCELADO]: 'Cancelado'
    };
    return labels[estado] || 'Desconocido';
  }

  /**
   * Manejar anuncios por voz basados en cambios de estado
   */
  private manejarAnunciosPorVoz(cambio: EstadoSincronizado) {
    console.log('🎤 Procesando anuncio por voz para cambio:', cambio);

    // Buscar información del pedido para anuncios más específicos
    const pedido = this.allPedidos.find(p => p.id === cambio.pedidoId);
    const mesa = cambio.mesa || pedido?.mesa || 'Sin definir';
    const cantidadItems = pedido?.items?.length || 0;

    try {
      // Manejar anuncios de estado de pago
      this.manejarAnunciosPago(cambio, mesa, cantidadItems, pedido);

      // Manejar anuncios de estado de pedido
      this.manejarAnunciosPedido(cambio, mesa, cantidadItems);

    } catch (error) {
      console.error('❌ Error en anuncio por voz:', error);
    }
  }  /**
   * Manejar anuncios específicos de cambios de estado de pago
   */
  private manejarAnunciosPago(cambio: EstadoSincronizado, mesa: string | number, cantidadItems: number, pedido?: Pedido) {
    const estadoPago = cambio.estadoPago;
    const pedidoId = cambio.pedidoId;

    if (estadoPago === EstadoPagoPedido.PAGO_REALIZADO) {
      console.log('💰 PAGO CONFIRMADO - Mesa', mesa, 'con', cantidadItems, 'items');

      // Crear clave única para este anuncio
      const claveAnuncio = `pago_realizado_${pedidoId}`;

      // Verificar si ya se hizo este anuncio recientemente
      if (this.puedeRealizarAnuncio(claveAnuncio)) {
        console.log('🔔 NOTIFICACIÓN: Pago completado exitosamente - El pedido puede ser aceptado');

        // Mostrar notificación visual más prominente
        this.mostrarNotificacionPago(pedido, mesa, 'exitoso');

        // Cancelar cualquier anuncio pendiente para este pedido
        this.cancelarAnuncioPendiente(pedidoId);

        // Programar anuncio con debounce para evitar repeticiones
        this.programarAnuncioConDebounce(pedidoId, claveAnuncio, () => {
          if (this.voiceService.soporteVoz) {
            const mensaje = `Mesa ${mesa}: Pago confirmado. Pedido listo para aceptar.`;
            this.voiceService.hablar(mensaje);
          }
        });

        // Actualizar lista de pedidos con pago completado
        this.actualizarPedidosConPagoCompletado();

        // Forzar actualización de la vista para mostrar el botón de aceptar
        this.applyFilter(this.selectedFilter);
      } else {
        console.log('🔇 Anuncio de pago ya realizado recientemente para pedido:', pedidoId);
      }
    }

    if (estadoPago === EstadoPagoPedido.PAGO_FALLIDO) {
      const claveAnuncio = `pago_fallido_${pedidoId}`;

      if (this.puedeRealizarAnuncio(claveAnuncio)) {
        console.log('❌ PAGO FALLIDO - Mesa', mesa, 'pedido', cambio.pedidoId);
        console.log('🔔 NOTIFICACIÓN: Error en el pago - Se requiere reintentar el pago');

        // Mostrar notificación de error
        this.mostrarNotificacionPago(pedido, mesa, 'fallido');

        // Marcar anuncio como realizado
        this.marcarAnuncioRealizado(claveAnuncio);
      }
    }

    if (estadoPago === EstadoPagoPedido.PROCESANDO_PAGO) {
      const claveAnuncio = `pago_procesando_${pedidoId}`;

      if (this.puedeRealizarAnuncio(claveAnuncio)) {
        console.log('⏳ PROCESANDO PAGO - Mesa', mesa, 'pedido', cambio.pedidoId);
        console.log('🔔 NOTIFICACIÓN: Pago en proceso - Aguardando confirmación');

        // Mostrar notificación de procesamiento
        this.mostrarNotificacionPago(pedido, mesa, 'procesando');

        // Marcar anuncio como realizado
        this.marcarAnuncioRealizado(claveAnuncio);
      }
    }
  }

  /**
   * Manejar anuncios específicos de cambios de estado de pedido
   */
  private manejarAnunciosPedido(cambio: EstadoSincronizado, mesa: string | number, cantidadItems: number) {
    const estadoPedido = cambio.estadoPedido;
    const estadoPago = cambio.estadoPago;

    if (estadoPedido === EstadoPedido.LISTO) {
      const mensaje = `Mesa ${mesa}: Pedido número ${cambio.pedidoId} está listo para entregar.`;
      console.log('🎤 Anunciando pedido listo:', mensaje);

      if (this.voiceService.soporteVoz) {
        this.voiceService.hablar(mensaje);
      }
    }

    // Anuncio cuando se pasa a preparación después del pago
    if (estadoPedido === EstadoPedido.EN_PREPARACION && estadoPago === EstadoPagoPedido.PAGO_REALIZADO) {
      const mensaje = `Iniciando preparación para mesa ${mesa}.`;
      console.log('🎤 Anunciando inicio de preparación:', mensaje);

      if (this.voiceService.soporteVoz) {
        this.voiceService.hablar(mensaje);
      }
    }
  }

  /**
   * Mostrar notificación visual para pagos completados
   */
  private mostrarNotificacionPago(pedido: Pedido | undefined, mesa: string | number, tipo: 'exitoso' | 'fallido' | 'procesando' = 'exitoso') {
    if (pedido) {
      const iconos = {
        exitoso: '💰',
        fallido: '❌',
        procesando: '⏳'
      };

      const mensajes = {
        exitoso: 'PAGO COMPLETADO',
        fallido: 'PAGO FALLIDO',
        procesando: 'PROCESANDO PAGO'
      };

      console.log(`${iconos[tipo]} ${mensajes[tipo]} - Mesa ${mesa}: ${pedido.items?.length || 0} items - Total: $${pedido.total || 0}`);

      // Aquí se podría agregar una notificación visual más elaborada
      // como un toast, modal, cambio de color temporal, o sonido de notificación

      if (tipo === 'exitoso') {
        console.log('🔔 ACCIÓN REQUERIDA: El pedido puede ser aceptado y enviado a cocina');
      } else if (tipo === 'fallido') {
        console.log('🔔 ACCIÓN REQUERIDA: Se debe solicitar al cliente que reintente el pago');
      } else if (tipo === 'procesando') {
        console.log('🔔 INFO: Aguardando confirmación del sistema de pagos');
      }
    }
  }  /**
   * 🔔 FUNCIÓN OPTIMIZADA: Cargar notificaciones para el mesero sin alertas duplicadas
   */
  private cargarNotificacionesMesero() {
    console.log('🔔 Cargando notificaciones para el mesero...');

    // Control de tiempo para evitar revisiones muy frecuentes
    const ahora = new Date();
    if (this.ultimaRevisionNotificaciones &&
        (ahora.getTime() - this.ultimaRevisionNotificaciones.getTime()) < 5000) {
      console.log('ℹ️ Evitando revisión de notificaciones muy frecuente');
      return;
    }

    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
      const notificacionesNoLeidas = notificaciones.filter((n: any) =>
        !n.leida && !this.notificacionesMeseroMostradas.has(n.pedidoId)
      );

      if (notificacionesNoLeidas.length > 0) {
        console.log(`🔔 ${notificacionesNoLeidas.length} notificaciones nuevas para el mesero`);

        // Marcar como mostradas para evitar duplicados
        notificacionesNoLeidas.forEach((n: any) => {
          this.notificacionesMeseroMostradas.add(n.pedidoId);
        });

        // ✅ MEJORA: Solo loggear, no mostrar alertas. El sistema visual del HTML ya maneja las notificaciones
        console.log('ℹ️ Las notificaciones se muestran en la interfaz visual, no se requieren alertas adicionales');
      }

      this.ultimaRevisionNotificaciones = ahora;
    } catch (error) {
      console.error('❌ Error cargando notificaciones del mesero:', error);
    }
  }
  /**
   * 🔔 NUEVA FUNCIÓN: Marcar notificación como leída cuando se acepta un pedido
   */
  private marcarNotificacionComoLeida(pedidoId: string) {
    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
      const notificacionIndex = notificaciones.findIndex((n: any) => n.pedidoId === pedidoId);

      if (notificacionIndex !== -1) {
        notificaciones[notificacionIndex].leida = true;
        notificaciones[notificacionIndex].fechaLectura = new Date().toISOString();
        localStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));

        console.log('✅ Notificación marcada como leída para pedido:', pedidoId);

        // Limpiar de las notificaciones mostradas
        this.notificacionesMeseroMostradas.delete(pedidoId);
      }
    } catch (error) {
      console.error('❌ Error marcando notificación como leída:', error);
    }
  }

  /**
   * 🧹 NUEVA FUNCIÓN: Limpiar notificaciones del mesero mostradas periódicamente
   */
  private limpiarNotificacionesMeseroMostradas() {
    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
      const pedidosLeidosIds = notificaciones
        .filter((n: any) => n.leida)
        .map((n: any) => n.pedidoId);      // Remover de las mostradas las que ya fueron leídas
      pedidosLeidosIds.forEach((id: string) => {
        this.notificacionesMeseroMostradas.delete(id);
      });

      console.log(`🧹 Limpieza de notificaciones: ${pedidosLeidosIds.length} notificaciones leídas removidas del control`);
    } catch (error) {
      console.error('❌ Error limpiando notificaciones mostradas:', error);
    }
  }
  // 🔔 NUEVA FUNCIÓN: Procesar evento de pago completado
  private procesarPagoCompletado(detalleEvento: any) {
    console.log('💰 Procesando pago completado desde evento global:', detalleEvento);

    try {
      // Actualizar estado local inmediatamente
      this.estadosPago[detalleEvento.pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;

      // Actualizar en el servicio de sincronización
      this.estadoSincronizacionService.actualizarEstadoPago(
        detalleEvento.pedidoId,
        EstadoPagoPedido.PAGO_REALIZADO
      );

      // Recargar notificaciones del mesero
      this.cargarNotificacionesMesero();      // Recargar pedidos para asegurar sincronización
      window.setTimeout(() => {
        this.loadPedidos();
      }, 1000);

      console.log('✅ Pago completado procesado exitosamente');
    } catch (error) {
      console.error('❌ Error procesando pago completado:', error);
    }
  }

  /**
   * 🔄 NUEVA FUNCIÓN: Cargar todos los pagos completados (incluyendo emergencias)
   */
  private cargarTodosPagosCompletados() {
    console.log('🔄 Cargando todos los pagos completados...');

    try {
      // 1. Cargar desde estados de pago separados
      const estadosPago = JSON.parse(localStorage.getItem('estados_pago_pedidos') || '{}');
      Object.entries(estadosPago).forEach(([pedidoId, estado]: [string, any]) => {
        if (estado.estadoPago === 'PAGO_REALIZADO') {
          this.estadosPago[pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;
          console.log(`💾 Pago completado cargado: ${pedidoId}`);
        }
      });

      // 2. Cargar desde registros de pago directo
      const registrosPago = JSON.parse(localStorage.getItem('registros_pago') || '[]');
      registrosPago.forEach((registro: any) => {
        if (registro.estadoPago === 'PAGO_REALIZADO') {
          this.estadosPago[registro.id] = EstadoPagoPedido.PAGO_REALIZADO;
          console.log(`💾 Registro de pago directo cargado: ${registro.id}`);
        }
      });

      // 3. Cargar desde pagos de emergencia
      const pagosEmergencia = JSON.parse(localStorage.getItem('pagos_emergencia') || '[]');
      pagosEmergencia.forEach((pago: any) => {
        if (pago.estadoPago === 'PAGO_REALIZADO') {
          this.estadosPago[pago.pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;
          console.log(`🚨 Pago de emergencia cargado: ${pago.pedidoId}`);
        }
      });

      // 4. Verificar pagos individuales de emergencia
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pago_emergencia_')) {
          try {
            const pagoEmergencia = JSON.parse(localStorage.getItem(key) || '{}');
            if (pagoEmergencia.estadoPago === 'PAGO_REALIZADO') {
              this.estadosPago[pagoEmergencia.pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;
              console.log(`🚨 Pago de emergencia individual cargado: ${pagoEmergencia.pedidoId}`);
            }
          } catch (error) {
            console.warn('⚠️ Error cargando pago de emergencia:', key, error);
          }
        }
      });      console.log('✅ Todos los pagos completados cargados:', this.estadosPago);

    } catch (error) {
      console.error('❌ Error cargando pagos completados:', error);
    }
  }

  /**
   * ⚡ NUEVA FUNCIÓN: Procesar pago completado de forma inmediata
   */
  private procesarPagoCompletadoInmediato(detalleEvento: any) {
    console.log('⚡ 💰 PROCESANDO PAGO COMPLETADO INMEDIATO:', detalleEvento);

    try {
      // 1. Actualizar estado local INMEDIATAMENTE
      this.estadosPago[detalleEvento.pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;
      console.log(`⚡ Estado de pago actualizado INMEDIATAMENTE para ${detalleEvento.pedidoId}`);

      // 2. Buscar y actualizar el pedido en la lista local
      const pedidoIndex = this.allPedidos.findIndex(p => p.id === detalleEvento.pedidoId);
      if (pedidoIndex !== -1) {
        // Actualizar datos del pedido con información del pago
        if (detalleEvento.transaccionId) {
          (this.allPedidos[pedidoIndex] as any).transaccionId = detalleEvento.transaccionId;
        }
        if (detalleEvento.metodoPago) {
          (this.allPedidos[pedidoIndex] as any).metodoPago = detalleEvento.metodoPago;
        }

        console.log(`⚡ Pedido ${detalleEvento.pedidoId} actualizado en lista local`);
      }

      // 3. Actualizar en el servicio de sincronización
      this.estadoSincronizacionService.actualizarEstadoPago(
        detalleEvento.pedidoId,
        EstadoPagoPedido.PAGO_REALIZADO
      );

      // 4. Re-aplicar filtros para mostrar cambios inmediatamente
      this.applyFilter(this.selectedFilter);

      // 5. Actualizar lista de pedidos con pago completado
      this.actualizarPedidosConPagoCompletado();

      // 6. Mostrar notificación visual prominente
      this.mostrarNotificacionPagoInmediata(detalleEvento);

      // 7. Anuncio por voz si está disponible
      if (this.voiceService.soporteVoz) {
        const mensaje = `¡Pago confirmado! Pedido ${detalleEvento.pedidoId.substring(0, 8)} listo para aceptar.`;        window.setTimeout(() => {
          this.voiceService.hablar(mensaje);
        }, 500);
      }

      console.log('⚡ ✅ Pago completado procesado INMEDIATAMENTE');

    } catch (error) {
      console.error('❌ Error procesando pago completado inmediato:', error);
    }
  }

  /**
   * 🔄 NUEVA FUNCIÓN: Ejecutar recarga forzada de pedidos
   */
  private ejecutarRecargaForzada() {
    console.log('🔄 ⚡ EJECUTANDO RECARGA FORZADA DE PEDIDOS...');

    try {
      // 1. Recargar todos los datos críticos
      this.cargarEstadosPagosPersistentes();
      this.cargarTodosPagosCompletados();
      this.cargarNotificacionesMesero();      // 2. Recargar pedidos con un pequeño delay para asegurar sincronización
      window.setTimeout(() => {
        this.loadPedidos();
        console.log('🔄 ✅ Recarga forzada completada');
      }, 200);

    } catch (error) {
      console.error('❌ Error en recarga forzada:', error);
    }
  }

  /**
   * 🔔 NUEVA FUNCIÓN: Mostrar notificación visual inmediata
   */
  private mostrarNotificacionPagoInmediata(detalleEvento: any) {
    try {
      const pedido = this.allPedidos.find(p => p.id === detalleEvento.pedidoId);
      const mesa = pedido?.mesa || 'N/A';
      const cliente = pedido?.clienteNombre || 'Cliente';
      const monto = detalleEvento.monto || pedido?.total || 0;

      console.log(`🔔 ⚡ PAGO INMEDIATO CONFIRMADO:`);
      console.log(`   💳 Mesa: ${mesa}`);
      console.log(`   👤 Cliente: ${cliente}`);
      console.log(`   💰 Monto: $${monto.toLocaleString()}`);
      console.log(`   🔑 Transacción: ${detalleEvento.transaccionId}`);
      console.log(`   📱 Método: ${detalleEvento.metodoPago}`);
      console.log(`   🚨 ACCIÓN: El pedido puede ser aceptado INMEDIATAMENTE`);      // Mostrar alerta al mesero después de un pequeño delay
      window.setTimeout(() => {
        alert(`🔔 ¡PAGO CONFIRMADO INMEDIATAMENTE!\n\n` +
              `Mesa: ${mesa}\n` +
              `Cliente: ${cliente}\n` +
              `Monto: $${monto.toLocaleString()}\n` +
              `Método: ${detalleEvento.metodoPago}\n\n` +
              `✅ El pedido está listo para aceptar y enviar a cocina.`);
      }, 1000);} catch (error) {
      console.error('❌ Error mostrando notificación inmediata:', error);
    }
  }

  /**
   * 🔇 NUEVA FUNCIÓN: Verificar si se puede realizar un anuncio
   */
  private puedeRealizarAnuncio(claveAnuncio: string): boolean {
    const ahora = new Date();
    const ultimoAnuncio = this.anunciosRealizados[claveAnuncio];

    if (!ultimoAnuncio) {
      return true; // Primera vez
    }

    const tiempoTranscurrido = ahora.getTime() - ultimoAnuncio.getTime();
    return tiempoTranscurrido >= this.tiempoMinimoEntreAnuncios;
  }

  /**
   * 🔇 NUEVA FUNCIÓN: Marcar anuncio como realizado
   */
  private marcarAnuncioRealizado(claveAnuncio: string): void {
    this.anunciosRealizados[claveAnuncio] = new Date();
    console.log(`🔇 Anuncio marcado como realizado: ${claveAnuncio}`);
  }

  /**
   * 🔇 NUEVA FUNCIÓN: Programar anuncio con debounce
   */
  private programarAnuncioConDebounce(pedidoId: string, claveAnuncio: string, callback: () => void): void {    // Cancelar anuncio pendiente si existe
    this.cancelarAnuncioPendiente(pedidoId);

    // Programar nuevo anuncio con delay
    this.anunciosPendientes[pedidoId] = window.setTimeout(() => {
      callback();
      this.marcarAnuncioRealizado(claveAnuncio);
      delete this.anunciosPendientes[pedidoId];
    }, 1000); // 1 segundo de delay para evitar duplicados inmediatos

    console.log(`🔇 Anuncio programado para pedido: ${pedidoId}`);
  }

  /**
   * 🔇 NUEVA FUNCIÓN: Cancelar anuncio pendiente
   */
  private cancelarAnuncioPendiente(pedidoId: string): void {
    if (this.anunciosPendientes[pedidoId]) {
      clearTimeout(this.anunciosPendientes[pedidoId]);
      delete this.anunciosPendientes[pedidoId];
      console.log(`🔇 Anuncio pendiente cancelado para pedido: ${pedidoId}`);
    }
  }

  /**
   * 🔇 NUEVA FUNCIÓN: Limpiar anuncios antiguos (limpieza de memoria)
   */
  private limpiarAnunciosAntiguos(): void {
    const ahora = new Date();
    const tiempoLimite = 60000; // 1 minuto

    Object.keys(this.anunciosRealizados).forEach(clave => {
      const tiempoAnuncio = this.anunciosRealizados[clave];
      if ((ahora.getTime() - tiempoAnuncio.getTime()) > tiempoLimite) {
        delete this.anunciosRealizados[clave];
      }
    });
  }
}
