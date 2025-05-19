import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Gestión de Pedidos</h2>

      <div class="status-filters">
        <button class="filter-btn active">Todos</button>
        <button class="filter-btn">Pendientes</button>
        <button class="filter-btn">En Preparación</button>
        <button class="filter-btn">Listos</button>
        <button class="filter-btn">Entregados</button>
      </div>

      <div class="pedidos-grid">
        <div class="pedido-card pendiente">
          <div class="pedido-header">
            <span class="pedido-id">Pedido #1001</span>
            <span class="pedido-status">Pendiente</span>
          </div>
          <div class="pedido-content">
            <h4>Detalle del Pedido</h4>
            <ul class="pedido-items">
              <li>1 x Ceviche de Camarones</li>
              <li>2 x Filete de Res</li>
              <li>1 x Tiramisú</li>
            </ul>
            <div class="pedido-info">
              <p><strong>Mesa:</strong> 5</p>
              <p><strong>Cliente:</strong> Juan Pérez</p>
              <p><strong>Hora:</strong> 14:30</p>
            </div>
          </div>
          <div class="pedido-actions">
            <button class="action-btn accept">Aceptar</button>
            <button class="action-btn cancel">Cancelar</button>
          </div>
        </div>

        <div class="pedido-card en-preparacion">
          <div class="pedido-header">
            <span class="pedido-id">Pedido #1002</span>
            <span class="pedido-status">En Preparación</span>
          </div>
          <div class="pedido-content">
            <h4>Detalle del Pedido</h4>
            <ul class="pedido-items">
              <li>2 x Ensalada César</li>
              <li>2 x Pollo a la Plancha</li>
              <li>2 x Flan de Caramelo</li>
            </ul>
            <div class="pedido-info">
              <p><strong>Mesa:</strong> 3</p>
              <p><strong>Cliente:</strong> María López</p>
              <p><strong>Hora:</strong> 14:45</p>
            </div>
          </div>
          <div class="pedido-actions">
            <button class="action-btn ready">Listo para Entregar</button>
          </div>
        </div>

        <div class="pedido-card listo">
          <div class="pedido-header">
            <span class="pedido-id">Pedido #1003</span>
            <span class="pedido-status">Listo</span>
          </div>
          <div class="pedido-content">
            <h4>Detalle del Pedido</h4>
            <ul class="pedido-items">
              <li>1 x Carpaccio de Res</li>
              <li>1 x Salmón Grillado</li>
            </ul>
            <div class="pedido-info">
              <p><strong>Mesa:</strong> 7</p>
              <p><strong>Cliente:</strong> Carlos Ruiz</p>
              <p><strong>Hora:</strong> 15:00</p>
            </div>
          </div>
          <div class="pedido-actions">
            <button class="action-btn deliver">Marcar como Entregado</button>
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

    @media (max-width: 768px) {
      .pedidos-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GestionPedidosComponent {}
