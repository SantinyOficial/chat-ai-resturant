import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PedidoService, Pedido, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Mis Pedidos</h2>

      <div class="filtros">
        <button class="filter-btn" [class.active]="selectedFilter === 'all'" (click)="filterPedidos('all')">Todos</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'activos'" (click)="filterPedidos('activos')">Activos</button>
        <button class="filter-btn" [class.active]="selectedFilter === 'completados'" (click)="filterPedidos('completados')">Completados</button>
      </div>

      <div class="no-pedidos" *ngIf="misPedidos.length === 0">
        <p>No tienes pedidos realizados. Puedes hacer tu pedido hablando con nuestro asistente.</p>
        <button class="go-to-chat" routerLink="/chat-asistente">Ir al Asistente</button>
      </div>

      <div class="pedidos-grid" *ngIf="misPedidos.length > 0">
        <div class="pedido-card" *ngFor="let pedido of misPedidos" [ngClass]="pedido.estado.toLowerCase()">
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
              <p><strong>Total:</strong> {{pedido.total | currency:'COP':'symbol':'1.0-0'}}</p>
              <p><strong>Fecha:</strong> {{pedido.fechaCreacion | date:'dd/MM/yyyy H:mm'}}</p>
              <p *ngIf="pedido.observaciones"><strong>Observaciones:</strong> {{pedido.observaciones}}</p>
            </div>
          </div>
          <div class="pedido-progress" *ngIf="pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO'">
            <div class="progress-steps">
              <div class="step" [class.completed]="isStepCompleted(pedido.estado, 'PENDIENTE')">
                <div class="step-dot"></div>
                <span class="step-label">Recibido</span>
              </div>
              <div class="step" [class.completed]="isStepCompleted(pedido.estado, 'EN_PREPARACION')">
                <div class="step-dot"></div>
                <span class="step-label">En preparación</span>
              </div>
              <div class="step" [class.completed]="isStepCompleted(pedido.estado, 'LISTO')">
                <div class="step-dot"></div>
                <span class="step-label">Listo</span>
              </div>
              <div class="step" [class.completed]="isStepCompleted(pedido.estado, 'ENTREGADO')">
                <div class="step-dot"></div>
                <span class="step-label">Entregado</span>
              </div>
            </div>
          </div>
          <div class="pedido-status-message" *ngIf="pedido.estado === 'CANCELADO'">
            <p>Este pedido ha sido cancelado.</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 0;
      max-width: 1000px;
      margin: 0 auto;
    }

    h2, h4 {
      color: #ffcc29;
    }

    .filtros {
      display: flex;
      gap: 10px;
      margin: 20px 0;
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
    }

    .no-pedidos {
      text-align: center;
      padding: 40px 20px;
      background: #222;
      border-radius: 8px;
      margin-top: 20px;
      border: 2px solid #ffcc29;
      color: #ddd;
    }

    .go-to-chat {
      margin-top: 15px;
      padding: 10px 20px;
      background: #ffcc29;
      color: #181818;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .go-to-chat:hover {
      background: #ffdd54;
      box-shadow: 0 0 8px #ffcc29;
    }

    .pedidos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
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

    .pedido-card.en_preparacion {
      border-left: 4px solid #2196f3;
    }

    .pedido-card.listo {
      border-left: 4px solid #4caf50;
    }

    .pedido-card.entregado {
      border-left: 4px solid #9e9e9e;
      opacity: 0.8;
    }

    .pedido-card.cancelado {
      border-left: 4px solid #f44336;
      opacity: 0.7;
    }

    .pedido-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 15px;
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

    .pedido-card.en_preparacion .pedido-status {
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

    .pedido-progress {
      padding: 15px;
      border-top: 1px solid #333;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
    }

    .progress-steps::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 20px;
      right: 20px;
      height: 2px;
      background: #444;
      z-index: 1;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      z-index: 2;
    }

    .step-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #444;
      margin-bottom: 8px;
    }

    .step.completed .step-dot {
      background: #4caf50;
    }

    .step-label {
      font-size: 0.8rem;
      color: #888;
      text-align: center;
      max-width: 70px;
    }

    .step.completed .step-label {
      color: #4caf50;
    }

    .pedido-status-message {
      padding: 15px;
      text-align: center;
      color: #f44336;
      border-top: 1px solid #333;
    }

    @media (max-width: 768px) {
      .pedidos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PedidosComponent implements OnInit {
  misPedidos: Pedido[] = [];
  selectedFilter: string = 'all';
  // ID temporal del cliente (en producción se usaría autenticación real)
  clienteId: string = 'cliente-' + Math.floor(Math.random() * 1000);

  constructor(private pedidoService: PedidoService) {}

  ngOnInit() {
    this.loadUserPedidos();
  }

  loadUserPedidos() {
    this.pedidoService.getPedidosByCliente(this.clienteId).subscribe({
      next: (pedidos) => {
        this.misPedidos = pedidos;
        this.filterPedidos(this.selectedFilter);
      },
      error: (err) => {
        console.error('Error al cargar los pedidos del usuario', err);
      }
    });
  }

  filterPedidos(filter: string) {
    this.selectedFilter = filter;

    this.pedidoService.getPedidosByCliente(this.clienteId).subscribe({
      next: (pedidos) => {
        if (filter === 'all') {
          this.misPedidos = pedidos;
        } else if (filter === 'activos') {
          this.misPedidos = pedidos.filter(p =>
            p.estado !== EstadoPedido.ENTREGADO &&
            p.estado !== EstadoPedido.CANCELADO
          );
        } else if (filter === 'completados') {
          this.misPedidos = pedidos.filter(p =>
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
