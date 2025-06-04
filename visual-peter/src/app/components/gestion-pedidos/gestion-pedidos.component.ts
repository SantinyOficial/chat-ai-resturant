import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gestion-pedidos.component.html',
  styleUrls: ['./gestion-pedidos.component.scss']
})
export class GestionPedidosComponent implements OnInit {
  allPedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  selectedFilter: string = 'all';

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.loadPedidos();
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
}
