import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';
import { PagoService, EstadoPagoPedido } from '../../services/pago.service';
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
export class GestionPedidosComponent implements OnInit, OnDestroy {  allPedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  selectedFilter: string = 'all';
  estadosPago: { [pedidoId: string]: EstadoPagoPedido } = {};
  estadosSincronizados: { [pedidoId: string]: EstadoSincronizado } = {};
  private subscription?: Subscription;
  private estadosSubscription?: Subscription;

  // Referencias de enums para usar en template
  EstadoPedido = EstadoPedido;
  EstadoPagoPedido = EstadoPagoPedido;
  constructor(
    private pedidoService: PedidoService,
    private pagoService: PagoService,
    private voiceService: VoiceService,
    private estadoSincronizacionService: EstadoSincronizacionService
  ) {}  ngOnInit() {
    console.log('🚀 Inicializando componente de gestión de pedidos...');

    this.loadPedidos();

    // Suscribirse al servicio de sincronización centralizado
    this.estadosSubscription = this.estadoSincronizacionService.cambios$.subscribe(cambio => {
      if (cambio) {
        console.log('🔄 Cambio de estado recibido:', cambio);

        // Actualizar estados locales
        this.estadosSincronizados[cambio.pedidoId] = cambio;
        this.estadosPago[cambio.pedidoId] = cambio.estadoPago;

        // Encontrar y actualizar el pedido correspondiente
        const pedidoIndex = this.allPedidos.findIndex(p => p.id === cambio.pedidoId);
        if (pedidoIndex !== -1) {
          this.allPedidos[pedidoIndex].estado = cambio.estadoPedido;
          // Re-aplicar filtros
          this.applyFilter(this.selectedFilter);
        }

        // Anuncios por voz mejorados
        this.manejarAnunciosPorVoz(cambio);
      }
    });

    // También mantener la suscripción original como respaldo
    this.subscription = this.pagoService.estadoPagoChanged$.subscribe(({ pedidoId, estadoPago }) => {
      console.log(`🔄 Estado de pago actualizado (servicio original): Pedido ${pedidoId} -> ${estadoPago}`);

      // Actualizar en el servicio de sincronización
      this.estadoSincronizacionService.actualizarEstadoPago(pedidoId, estadoPago);
    });

    // Forzar sincronización inicial
    this.estadoSincronizacionService.forzarSincronizacion().subscribe(exito => {
      if (exito) {
        console.log('✅ Sincronización inicial completada');
        this.loadPedidos(); // Recargar después de la sincronización
      }
    });
  }
  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.estadosSubscription) {
      this.estadosSubscription.unsubscribe();
    }
  }

  loadPedidos() {
    this.pedidoService.getAllPedidos().subscribe({
      next: (pedidos) => {
        this.allPedidos = pedidos;
        this.applyFilter(this.selectedFilter);
      },
      error: (err) => {
        console.error('Error al cargar los pedidos', err);
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

    this.pedidoService.actualizarEstadoPedido(pedido.id!, estadoPedido).subscribe({
      next: (pedidoActualizado) => {
        // Actualizar el pedido en las listas
        const index = this.allPedidos.findIndex(p => p.id === pedido.id);
        if (index !== -1) {
          this.allPedidos[index] = pedidoActualizado;
        }

        // Volver a aplicar el filtro para actualizar la vista
        this.applyFilter(this.selectedFilter);
      },
      error: (err) => {
        console.error('Error al actualizar el estado del pedido', err);
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
      console.warn('No se puede aceptar el pedido. Verificar estado de pago.');
      return;
    }

    this.pedidoService.actualizarEstadoPedido(pedido.id!, EstadoPedido.EN_PREPARACION).subscribe({
      next: () => {
        console.log('Pedido aceptado y enviado a cocina');
        this.loadPedidos(); // Recargar para actualizar estados
      },
      error: (error: any) => {
        console.error('Error al aceptar pedido:', error);
      }
    });
  }
  getEstadoLabel(estado: EstadoPedido): string {
    const labels = {
      [EstadoPedido.PENDIENTE]: 'Pendiente',
      [EstadoPedido.EN_PREPARACION]: 'En Preparación',
      [EstadoPedido.LISTO]: 'Listo para Entregar',
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
  }

  /**
   * Manejar anuncios específicos de cambios de estado de pago
   */
  private manejarAnunciosPago(cambio: EstadoSincronizado, mesa: string | number, cantidadItems: number, pedido?: Pedido) {
    const estadoPago = cambio.estadoPago;

    if (estadoPago === EstadoPagoPedido.PAGO_REALIZADO) {
      const mensaje = `¡Atención cocina! Pago confirmado para mesa ${mesa}. con ${cantidadItems} items. Proceder con preparación.`;
      console.log('🎤 Anunciando pago completado:', mensaje);

      if (this.voiceService.soporteVoz) {
        this.voiceService.hablar(mensaje);
      } else {
        console.warn('⚠️ Servicio de voz no disponible');
      }

      // También mostrar notificación visual si es posible
      this.mostrarNotificacionPago(pedido, mesa);
    }

    if (estadoPago === EstadoPagoPedido.PAGO_FALLIDO) {
      const mensaje = `Atención: Pago fallido para mesa ${mesa}, pedido ${cambio.pedidoId}. Verificar con el cliente.`;
      console.log('🎤 Anunciando pago fallido:', mensaje);

      if (this.voiceService.soporteVoz) {
        this.voiceService.hablar(mensaje);
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
      const mensaje = `Iniciando preparación de pedido ${cambio.pedidoId} para mesa ${mesa}. Total de ${cantidadItems} items.`;
      console.log('🎤 Anunciando inicio de preparación:', mensaje);

      if (this.voiceService.soporteVoz) {
        this.voiceService.hablar(mensaje);
      }
    }
  }

  /**
   * Mostrar notificación visual para pagos completados
   */
  private mostrarNotificacionPago(pedido: Pedido | undefined, mesa: string | number) {
    if (pedido) {
      console.log(`💰 PAGO COMPLETADO - Mesa ${mesa}: ${pedido.items?.length || 0} items - Total: $${pedido.total || 0}`);

      // Aquí se podría agregar una notificación visual más elaborada
      // como un toast, modal, o cambio de color temporal
    }
  }
}
