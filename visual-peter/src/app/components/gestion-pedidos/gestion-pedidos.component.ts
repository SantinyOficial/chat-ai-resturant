import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Gestión de Pedidos</h2>

      <div class="status-filters">
        <button class="filter-btn" [class.active]="selectedFilter === 'all'" (click)="filterPedidos('all')">Todos</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'PENDIENTE'" (click)="filterPedidos('PENDIENTE')">Pendientes</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'EN_PREPARACION'" (click)="filterPedidos('EN_PREPARACION')">En Preparación</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'LISTO'" (click)="filterPedidos('LISTO')">Listos</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'ENTREGADO'" (click)="filterPedidos('ENTREGADO')">Entregados</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'CANCELADO'" (click)="filterPedidos('CANCELADO')">Cancelados</button>
      </div>

      <div class="pedidos-grid">
        <div *ngIf="filteredPedidos.length === 0" class="no-pedidos">
          <p>No hay pedidos con el filtro seleccionado.</p>
        </div>

        <div class="pedido-card" *ngFor="let pedido of filteredPedidos" [ngClass]="pedido.estado.toLowerCase()">
          <div class="pedido-header">
            <span class="pedido-id">Pedido #{{pedido.id?.substring(0, 8) || 'Nuevo'}}</span>
            <span class="pedido-status">{{getEstadoLabel(pedido.estado)}}</span>
          </div>
          <div class="pedido-content">
            <h4>Detalle del Pedido</h4>
            <ul class="pedido-items">
              <li *ngFor="let item of pedido.items">
                {{item.cantidad}} x {{item.nombre}}
              </li>
            </ul>
            <div class="pedido-info">
              <p><strong>Mesa:</strong> {{pedido.mesa}}</p>
              <p><strong>Cliente:</strong> {{pedido.clienteNombre}}</p>
              <p><strong>Hora:</strong> {{pedido.fechaCreacion | date:'HH:mm'}}</p>
              <p><strong>Total:</strong> {{pedido.total | currency:'COP':'symbol':'1.0-0'}}</p>
              <p *ngIf="pedido.observaciones"><strong>Observaciones:</strong> {{pedido.observaciones}}</p>
            </div>
          </div>
          <div class="pedido-actions">
            <ng-container [ngSwitch]="pedido.estado">
              <ng-container *ngSwitchCase="'PENDIENTE'">
                <button class="action-btn accept" (click)="changeStatus(pedido, 'EN_PREPARACION')">Aceptar</button>
                <button class="action-btn cancel" (click)="changeStatus(pedido, 'CANCELADO')">Cancelar</button>
              </ng-container>

              <ng-container *ngSwitchCase="'EN_PREPARACION'">
                <button class="action-btn ready" (click)="changeStatus(pedido, 'LISTO')">Listo para Entregar</button>
                <button class="action-btn cancel" (click)="changeStatus(pedido, 'CANCELADO')">Cancelar</button>
              </ng-container>

              <ng-container *ngSwitchCase="'LISTO'">
                <button class="action-btn deliver" (click)="changeStatus(pedido, 'ENTREGADO')">Marcar como Entregado</button>
              </ng-container>

              <ng-container *ngSwitchCase="'ENTREGADO'">
                <p class="status-message delivered">Este pedido ha sido entregado</p>
              </ng-container>

              <ng-container *ngSwitchCase="'CANCELADO'">
                <p class="status-message cancelled">Este pedido ha sido cancelado</p>
              </ng-container>
            </ng-container>
          </div>
        </div>
      </div>
    </div>
  `,  styles: [`
    .container {
      padding: 0;
      max-width: 1200px;
      margin: 0 auto;
    }

    h2, h4 {
      color: #ffcc29;
    }

    h2 {
      margin-bottom: 30px;
    }

    .status-filters {
      display: flex;
      gap: 10px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 8px 16px;
      background: #333;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-btn.active, .filter-btn:hover {
      background: #ffcc29;
      color: #181818;
    }    .pedidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .pedido-card {
      background: #222;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.3s ease;
      border: 2px solid #ffcc29;
    }

    .pedido-card:hover {
      transform: translateY(-5px);
    }

    .pedido-card.pendiente {
      border-left: 4px solid #ff9800;
    }

    .pedido-card.en-preparacion {
      border-left: 4px solid #2196f3;
    }

    .pedido-card.listo {
      border-left: 4px solid #4caf50;
    }

    .pedido-card.entregado {
      border-left: 4px solid #9e9e9e;
      opacity: 0.7;
    }

    .pedido-card.cancelado {
      border-left: 4px solid #f44336;
      opacity: 0.7;
    }

    .pedido-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      background: #2a2a2a;
      border-bottom: 1px solid #333;
    }

    .pedido-id {
      font-weight: bold;
      color: #fff;
    }

    .pedido-status {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .pedido-card.pendiente .pedido-status {
      background: #ff9800;
      color: #000;
    }

    .pedido-card.en-preparacion .pedido-status {
      background: #2196f3;
      color: #fff;
    }

    .pedido-card.listo .pedido-status {
      background: #4caf50;
      color: #000;
    }

    .pedido-card.entregado .pedido-status {
      background: #9e9e9e;
      color: #000;
    }

    .pedido-card.cancelado .pedido-status {
      background: #f44336;
      color: #fff;
    }

    .pedido-content {
      padding: 15px;
    }

    .pedido-items {
      list-style: none;
      padding: 0;
      margin: 0 0 15px 0;
      color: #ddd;
    }

    .pedido-items li {
      padding: 5px 0;
      border-bottom: 1px dashed #333;
    }

    .pedido-info {
      color: #bbb;
      font-size: 0.95rem;
    }

    .pedido-info p {
      margin: 5px 0;
    }

    .pedido-actions {
      display: flex;
      gap: 10px;
      padding: 15px;
      background: #2a2a2a;
      border-top: 1px solid #333;
    }

    .action-btn {
      flex: 1;
      padding: 8px 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .action-btn.accept {
      background: #4caf50;
      color: #fff;
    }

    .action-btn.cancel {
      background: #f44336;
      color: #fff;
    }

    .action-btn.ready {
      background: #2196f3;
      color: #fff;
    }

    .action-btn.deliver {
      background: #9c27b0;
      color: #fff;
    }

    .action-btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    .no-pedidos {
      text-align: center;
      padding: 20px;
      background: #222;
      border-radius: 8px;
      border: 2px solid #ffcc29;
      color: #888;
      grid-column: 1 / -1;
    }

    .status-message {
      text-align: center;
      padding: 8px;
      border-radius: 4px;
      width: 100%;
    }

    .status-message.delivered {
      background: rgba(158, 158, 158, 0.2);
      color: #9e9e9e;
    }

    .status-message.cancelled {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    @media (max-width: 768px) {
      .pedidos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
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
