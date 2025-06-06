import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidoService, Pedido } from '../../services/pedido.service';
import { PagoService } from '../../services/pago.service';
import { EstadoPagoPedido, EstadoPedido } from '../../models/enums';
import { PagoClienteComponent } from '../pago-cliente/pago-cliente.component';
import { EstadoSincronizacionService, EstadoSincronizado } from '../../services/estado-sincronizacion.service';
import { Inject } from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule, PagoClienteComponent],
  templateUrl: './pedidos.component.html',
  styleUrls: ['./pedidos.component.scss']
})
export class PedidosComponent implements OnInit, OnDestroy {
  misPedidos: Pedido[] = [];
  selectedFilter: string = 'all';
  pedidosInterval: any;
  isLoading: boolean = false;
  lastUpdate: Date | null = null;
  // Usar el mismo clienteId que se usa en el asistente
  clienteId: string = localStorage.getItem('clienteId') ||
                      ('cliente-' + Math.floor(Math.random() * 1000));
  // Estados de pago para cada pedido
  estadosPago: { [pedidoId: string]: EstadoPagoPedido } = {};
  // Estados sincronizados centralmente
  estadosSincronizados: { [pedidoId: string]: EstadoSincronizado } = {};
  private estadosSubscription?: Subscription;

  // Referencia del enum para usar en template
  EstadoPagoPedido = EstadoPagoPedido;
  constructor(
    private pedidoService: PedidoService,
    private pagoService: PagoService,
    @Inject(EstadoSincronizacionService) private estadoSincronizacionService: EstadoSincronizacionService
  ) {
    // Guardar el ID del cliente en localStorage si no existe
    if (!localStorage.getItem('clienteId')) {
      localStorage.setItem('clienteId', this.clienteId);
    }
  }
  ngOnInit() {
    console.log('🚀 Inicializando componente de pedidos (meseros)...');
    this.loadUserPedidos();

    // Actualizar pedidos cada 30 segundos
    this.pedidosInterval = setInterval(() => {
      this.loadUserPedidos();
    }, 30000);    // Suscribirse a cambios de estado centralizados
    this.estadosSubscription = this.estadoSincronizacionService.cambios$.subscribe(estados => {
      // Procesar cada estado en el array
      estados.forEach(cambio => {
        if (cambio) {
          console.log('🔄 Cambio de estado recibido en pedidos (meseros):', cambio);

          // Actualizar estados locales
          this.estadosSincronizados[cambio.pedidoId] = cambio;
          this.estadosPago[cambio.pedidoId] = cambio.estadoPago;

          // Actualizar el pedido correspondiente si existe en la lista
          const pedidoIndex = this.misPedidos.findIndex(p => p.id === cambio.pedidoId);
          if (pedidoIndex !== -1) {
            this.misPedidos[pedidoIndex].estado = cambio.estadoPedido;
            console.log(`✅ Pedido ${cambio.pedidoId} actualizado - Estado: ${cambio.estadoPedido}, Pago: ${cambio.estadoPago}`);
          }
        }
      });
    });    // Mantener también la suscripción original como respaldo
    this.pagoService.estadoPagoChanged$.subscribe((cambio: any) => {
      const { pedidoId, estadoPago } = cambio;
      this.estadosPago[pedidoId] = estadoPago;
    });
  }
  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.pedidosInterval) {
      clearInterval(this.pedidosInterval);
    }
    // Limpiar suscripciones
    if (this.estadosSubscription) {
      this.estadosSubscription.unsubscribe();
    }
  }
  loadUserPedidos() {
    this.isLoading = true;
    this.pedidoService.getPedidosByCliente(this.clienteId).subscribe({
      next: (pedidos) => {
        // Guardar todos los pedidos sin filtrar
        this.misPedidos = pedidos;

        // Cargar estados de pago para cada pedido SOLO si no existen ya
        pedidos.forEach(pedido => {
          if (pedido.id) {
            // Solo actualizar si no tenemos ya un estado cargado o si es diferente
            const estadoActual = this.estadosPago[pedido.id];
            const estadoPersistente = this.pagoService.getEstadoPagoPedido(pedido.id);

            // Priorizar estados más avanzados (ej: no sobrescribir PAGO_REALIZADO con PENDIENTE_PAGO)
            if (!estadoActual || this.esEstadoMasAvanzado(estadoPersistente, estadoActual)) {
              console.log(`🔄 Actualizando estado de pago para pedido ${pedido.id}: ${estadoActual} -> ${estadoPersistente}`);
              this.estadosPago[pedido.id] = estadoPersistente;
            } else {
              console.log(`✅ Manteniendo estado existente para pedido ${pedido.id}: ${estadoActual}`);
            }
          }
        });

        // Actualizar la vista aplicando el filtro actual
        this.filterPedidos(this.selectedFilter);

        console.log(`Se cargaron ${pedidos.length} pedidos para el cliente ${this.clienteId}`);
        console.log('Estados de pago cargados:', this.estadosPago);

        // Guardar nuevamente el clienteId para mantener consistencia
        localStorage.setItem('clienteId', this.clienteId);
        this.isLoading = false;
        this.lastUpdate = new Date();
      },
      error: (err) => {
        console.error('Error al cargar los pedidos del usuario', err);
        this.isLoading = false;
      }
    });
  }

  // Método auxiliar para determinar si un estado es más avanzado que otro
  private esEstadoMasAvanzado(nuevoEstado: EstadoPagoPedido, estadoActual: EstadoPagoPedido): boolean {
    const jerarquia = {
      [EstadoPagoPedido.PENDIENTE_PAGO]: 1,
      [EstadoPagoPedido.PROCESANDO_PAGO]: 2,
      [EstadoPagoPedido.PAGO_FALLIDO]: 2, // Mismo nivel que procesando para permitir reintentos
      [EstadoPagoPedido.PAGO_REALIZADO]: 3
    };

    return jerarquia[nuevoEstado] > jerarquia[estadoActual];
  }

  filterPedidos(filter: string) {
    this.selectedFilter = filter;

    // Usamos los pedidos ya cargados en memoria en lugar de hacer una nueva solicitud
    const pedidosOriginales = [...this.misPedidos];

    if (filter === 'all') {
      // No filtramos, mostramos todos
    } else if (filter === 'activos') {
      this.misPedidos = pedidosOriginales.filter(p =>
        p.estado !== EstadoPedido.ENTREGADO &&
        p.estado !== EstadoPedido.CANCELADO
      );
    } else if (filter === 'completados') {
      this.misPedidos = pedidosOriginales.filter(p =>
        p.estado === EstadoPedido.ENTREGADO ||
        p.estado === EstadoPedido.CANCELADO
      );
    }

    // Ordenar por fecha (más recientes primero)
    this.misPedidos.sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date();
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
  }
  getEstadoLabel(estado: EstadoPedido): string {
    const estados = {
      [EstadoPedido.PENDIENTE]: 'Pendiente',
      [EstadoPedido.CONFIRMADO]: 'Confirmado',
      [EstadoPedido.EN_PREPARACION]: 'En Preparación',
      [EstadoPedido.LISTO]: 'Listo para Entregar',
      [EstadoPedido.EN_CAMINO]: 'En Camino',
      [EstadoPedido.ENTREGADO]: 'Entregado',
      [EstadoPedido.CANCELADO]: 'Cancelado'
    };
    return estados[estado] || estado;
  }

  // Obtener estado de pago para un pedido
  getEstadoPago(pedidoId: string): EstadoPagoPedido {
    return this.estadosPago[pedidoId] || EstadoPagoPedido.PENDIENTE_PAGO;
  }

  // Verificar si un pedido necesita pago
  necesitaPago(pedido: Pedido): boolean {
    if (!pedido.id) return false;
    const estadoPago = this.getEstadoPago(pedido.id);
    return estadoPago === EstadoPagoPedido.PENDIENTE_PAGO &&
           pedido.estado === EstadoPedido.PENDIENTE;
  }  // Manejar evento de pago completado
  onPagoCompletado(event: {pedidoId: string, exitoso: boolean, pago?: any}) {
    console.log('🎉 Evento de pago completado recibido:', event);

    if (event.exitoso) {
      // Actualizar estado de pago local INMEDIATAMENTE
      this.estadosPago[event.pedidoId] = EstadoPagoPedido.PAGO_REALIZADO;

      console.log('✅ Actualizando pedido a EN_PREPARACION...');

      // Primero actualizar en el servicio de sincronización para notificar a gestión-pedidos
      this.estadoSincronizacionService.actualizarEstadoPago(
        event.pedidoId,
        EstadoPagoPedido.PAGO_REALIZADO
      );

      // Luego actualizar estado del pedido en backend
      this.pedidoService.actualizarEstadoPedido(event.pedidoId, EstadoPedido.EN_PREPARACION)
        .subscribe({
          next: (pedido) => {
            console.log('✅ Pedido actualizado exitosamente a EN_PREPARACION:', pedido);

            // Actualizar también el pedido local
            const pedidoIndex = this.misPedidos.findIndex(p => p.id === event.pedidoId);
            if (pedidoIndex !== -1) {
              this.misPedidos[pedidoIndex].estado = EstadoPedido.EN_PREPARACION;
            }

            // Sincronizar estado del pedido con el servicio centralizado
            this.estadoSincronizacionService.actualizarEstadoPedido(
              event.pedidoId,
              EstadoPedido.EN_PREPARACION
            );
          },
          error: (err) => {
            console.error('❌ Error actualizando estado del pedido tras pago:', err);
          }
        });

      // Mostrar mensaje de éxito al cliente
      console.log('🎉 ¡Pago realizado exitosamente! Tu pedido se está preparando.');

      // Recargar pedidos para reflejar todos los cambios
      setTimeout(() => {
        this.loadUserPedidos();
      }, 2000);
    } else {
      console.log('❌ El pago falló');
      // Actualizar estado de pago local
      this.estadosPago[event.pedidoId] = EstadoPagoPedido.PAGO_FALLIDO;

      // Sincronizar el fallo con el servicio centralizado
      this.estadoSincronizacionService.actualizarEstadoPago(
        event.pedidoId,
        EstadoPagoPedido.PAGO_FALLIDO
      );
    }
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
  isStepCompleted(currentEstado: EstadoPedido, stepEstado: string): boolean {
    const estados = [
      EstadoPedido.PENDIENTE,
      EstadoPedido.CONFIRMADO,
      EstadoPedido.EN_PREPARACION,
      EstadoPedido.LISTO,
      EstadoPedido.ENTREGADO
    ];

    const currentIndex = estados.indexOf(currentEstado);
    const stepIndex = estados.indexOf(stepEstado as EstadoPedido);

    return currentIndex >= stepIndex;
  }
}
