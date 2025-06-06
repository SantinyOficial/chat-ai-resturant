import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocinaService, PedidoCocina, EstadoCocina, PrioridadPedido, EstadisticasCocina, CocineroAsignado } from '../../services/cocina.service';
import { IAAsistenteComponent } from '../ia-asistente/ia-asistente.component';

// Interfaz extendida para el componente que incluye propiedades temporales
interface PedidoCocinaExtendido extends PedidoCocina {
  cocineroTemporal?: string;
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, FormsModule, IAAsistenteComponent],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.scss']
})
export class CocinaComponent implements OnInit, OnDestroy {
  activeTab: string = 'pendientes';

  // Estados de carga
  loadingPendientes: boolean = true;
  loadingPreparacion: boolean = false;
  loadingListos: boolean = false;
  loadingCocineros: boolean = false;
  procesandoPedido: string | null = null;

  // Datos
  pedidosPendientes: PedidoCocinaExtendido[] = [];
  pedidosEnPreparacion: PedidoCocinaExtendido[] = [];
  pedidosListos: PedidoCocinaExtendido[] = [];
  cocinerosDisponibles: CocineroAsignado[] = [];
  estadisticas: EstadisticasCocina | null = null;

  // Actualización automática
  private refreshInterval: any;

  constructor(
    private cocinaService: CocinaService
  ) {}

  ngOnInit() {
    this.loadEstadisticas();
    this.loadPedidosPendientes();
    this.loadCocineros();

    // Actualización automática cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.loadEstadisticas();
      if (this.activeTab === 'pendientes') {
        this.loadPedidosPendientes();
      } else if (this.activeTab === 'preparacion') {
        this.loadPedidosEnPreparacion();
      } else if (this.activeTab === 'listos') {
        this.loadPedidosListos();
      }
    }, 30000);
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshCurrentTab() {
    switch (this.activeTab) {
      case 'pendientes':
        this.loadPedidosPendientes();
        break;
      case 'preparacion':
        this.loadPedidosEnPreparacion();
        break;
      case 'listos':
        this.loadPedidosListos();
        break;
      case 'cocineros':
        this.loadCocineros();
        break;
    }
  }

  cambiarTab(tab: string) {
    this.activeTab = tab;
    this.refreshCurrentTab();
  }

  loadEstadisticas() {
    this.cocinaService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }

  loadPedidosPendientes() {
    this.loadingPendientes = true;
    this.cocinaService.getPedidosPendientes().subscribe({
      next: (pedidos) => {
        this.pedidosPendientes = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        })).sort((a, b) => {
          // Ordenar por prioridad y luego por fecha
          const prioridadOrder = { 'URGENTE': 3, 'ALTA': 2, 'NORMAL': 1 };
          const aPrioridad = prioridadOrder[a.prioridad as keyof typeof prioridadOrder] || 1;
          const bPrioridad = prioridadOrder[b.prioridad as keyof typeof prioridadOrder] || 1;

          if (aPrioridad !== bPrioridad) {
            return bPrioridad - aPrioridad;
          }

          return new Date(a.fechaRecibido).getTime() - new Date(b.fechaRecibido).getTime();
        });
        this.loadingPendientes = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos pendientes:', err);
        this.loadingPendientes = false;
      }
    });
  }

  loadPedidosEnPreparacion() {
    this.loadingPreparacion = true;
    this.cocinaService.getPedidosEnPreparacion().subscribe({
      next: (pedidos) => {
        this.pedidosEnPreparacion = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        }));
        this.loadingPreparacion = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos en preparación:', err);
        this.loadingPreparacion = false;
      }
    });
  }

  loadPedidosListos() {
    this.loadingListos = true;
    this.cocinaService.getPedidosListos().subscribe({
      next: (pedidos) => {
        this.pedidosListos = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        }));
        this.loadingListos = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos listos:', err);
        this.loadingListos = false;
      }
    });
  }

  loadCocineros() {
    this.loadingCocineros = true;
    this.cocinaService.getCocinerosDisponibles().subscribe({
      next: (cocineros) => {
        this.cocinerosDisponibles = cocineros;
        this.loadingCocineros = false;
      },
      error: (err) => {
        console.error('Error al cargar cocineros:', err);
        this.loadingCocineros = false;
      }
    });
  }

  iniciarPreparacion(pedido: PedidoCocina) {
    this.procesandoPedido = pedido.id;
    const cocineroId = (pedido as any).cocineroTemporal;

    this.cocinaService.iniciarPreparacion(pedido.id, cocineroId).subscribe({
      next: (pedidoActualizado) => {
        console.log('Preparación iniciada:', pedidoActualizado);
        this.procesandoPedido = null;
        this.loadPedidosPendientes();
        this.loadPedidosEnPreparacion();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al iniciar preparación:', err);
        this.procesandoPedido = null;
        alert('Error al iniciar la preparación del pedido.');
      }
    });
  }

  cambiarPrioridad(pedido: PedidoCocina) {
    const prioridades = ['NORMAL', 'ALTA', 'URGENTE'];
    const currentIndex = prioridades.indexOf(pedido.prioridad);
    const newIndex = (currentIndex + 1) % prioridades.length;
    const newPrioridad = prioridades[newIndex] as PrioridadPedido;

    this.cocinaService.cambiarPrioridad(pedido.id, newPrioridad).subscribe({
      next: (pedidoActualizado) => {
        console.log('Prioridad cambiada:', pedidoActualizado);
        this.loadPedidosPendientes();
      },
      error: (err) => {
        console.error('Error al cambiar prioridad:', err);
        alert('Error al cambiar la prioridad del pedido.');
      }
    });
  }

  actualizarEstadoItem(pedidoId: string, itemNombre: string, estado: EstadoCocina) {
    this.cocinaService.actualizarEstadoItem(pedidoId, itemNombre, estado).subscribe({
      next: (pedidoActualizado) => {
        console.log('Estado del ítem actualizado:', pedidoActualizado);
        this.loadPedidosEnPreparacion();
      },
      error: (err) => {
        console.error('Error al actualizar estado del ítem:', err);
      }
    });
  }

  pausarPedido(pedido: PedidoCocina) {
    const motivo = prompt('Motivo de la pausa (opcional):');

    this.cocinaService.pausarPedido(pedido.id, motivo || undefined).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido pausado:', pedidoActualizado);
        this.loadPedidosEnPreparacion();
      },
      error: (err) => {
        console.error('Error al pausar pedido:', err);
        alert('Error al pausar el pedido.');
      }
    });
  }

  marcarPedidoListo(pedido: PedidoCocina) {
    this.cocinaService.marcarPedidoListo(pedido.id).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido marcado como listo:', pedidoActualizado);
        this.loadPedidosEnPreparacion();
        this.loadPedidosListos();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al marcar pedido como listo:', err);
        alert('Error al marcar el pedido como listo.');
      }
    });
  }

  notificarPedidoListo(pedido: PedidoCocina) {
    this.cocinaService.notificarPedidoListo(pedido.id).subscribe({
      next: (resultado) => {
        console.log('Notificación enviada:', resultado);
        alert('Notificación enviada al cliente y mesero.');
      },
      error: (err) => {
        console.error('Error al enviar notificación:', err);
        alert('Error al enviar la notificación.');
      }
    });
  }

  marcarPedidoEntregado(pedido: PedidoCocina) {
    this.cocinaService.marcarPedidoEntregado(pedido.id).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido entregado:', pedidoActualizado);
        this.loadPedidosListos();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al marcar pedido como entregado:', err);
        alert('Error al marcar el pedido como entregado.');
      }
    });
  }

  verPedidosCocinero(cocinero: CocineroAsignado) {
    this.cocinaService.getPedidosPorCocinero(cocinero.id).subscribe({
      next: (pedidos) => {
        console.log(`Pedidos de ${cocinero.nombre}:`, pedidos);
        alert(`${cocinero.nombre} tiene ${pedidos.length} pedidos asignados.`);
      },
      error: (err) => {
        console.error('Error al cargar pedidos del cocinero:', err);
      }
    });
  }

  calcularProgreso(pedido: PedidoCocina): number {
    if (!pedido.items || pedido.items.length === 0) return 0;

    const itemsListos = pedido.items.filter(item => item.estado === EstadoCocina.LISTO).length;
    return Math.round((itemsListos / pedido.items.length) * 100);
  }

  calcularTiempoTranscurrido(fecha?: string): string {
    if (!fecha) return 'Desconocido';

    const now = new Date().getTime();
    const inicio = new Date(fecha).getTime();
    const diferencia = now - inicio;

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);

    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    }
    return `${minutos}m`;
  }

  getPrioridadTexto(prioridad: PrioridadPedido): string {
    const textos = {
      'NORMAL': 'Normal',
      'ALTA': 'Alta',
      'URGENTE': 'Urgente'
    };
    return textos[prioridad] || prioridad;
  }

  getEstadoTexto(estado: EstadoCocina): string {
    const textos = {
      'RECIBIDO': 'Recibido',
      'EN_PREPARACION': 'En Preparación',
      'LISTO': 'Listo',
      'ENTREGADO': 'Entregado',
      'PAUSADO': 'Pausado',
      'CANCELADO': 'Cancelado'
    };
    return textos[estado] || estado;
  }
}
