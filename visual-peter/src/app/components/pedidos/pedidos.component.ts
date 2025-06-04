import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(private pedidoService: PedidoService) {
    // Guardar el ID del cliente en localStorage si no existe
    if (!localStorage.getItem('clienteId')) {
      localStorage.setItem('clienteId', this.clienteId);
    }
  }

  ngOnInit() {
    this.loadUserPedidos();

    // Actualizar pedidos cada 30 segundos
    this.pedidosInterval = setInterval(() => {
      this.loadUserPedidos();
    }, 30000);
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.pedidosInterval) {
      clearInterval(this.pedidosInterval);
    }
  }  loadUserPedidos() {
    this.isLoading = true;
    this.pedidoService.getPedidosByCliente(this.clienteId).subscribe({
      next: (pedidos) => {
        // Guardar todos los pedidos sin filtrar
        this.misPedidos = pedidos;

        // Actualizar la vista aplicando el filtro actual
        this.filterPedidos(this.selectedFilter);

        console.log(`Se cargaron ${pedidos.length} pedidos para el cliente ${this.clienteId}`);

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
    const labels = {
      [EstadoPedido.PENDIENTE]: 'Pendiente',
      [EstadoPedido.EN_PREPARACION]: 'En Preparación',
      [EstadoPedido.LISTO]: 'Listo para Entregar',
      [EstadoPedido.ENTREGADO]: 'Entregado',
      [EstadoPedido.CANCELADO]: 'Cancelado'
    };
    return labels[estado] || 'Desconocido';
  }

  isStepCompleted(currentEstado: EstadoPedido, stepEstado: string): boolean {
    const estados = [
      EstadoPedido.PENDIENTE,
      EstadoPedido.EN_PREPARACION,
      EstadoPedido.LISTO,
      EstadoPedido.ENTREGADO
    ];

    const currentIndex = estados.indexOf(currentEstado);
    const stepIndex = estados.indexOf(stepEstado as EstadoPedido);

    return stepIndex <= currentIndex;
  }
}
