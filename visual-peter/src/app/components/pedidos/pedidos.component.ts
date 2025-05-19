import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h2>Realizar Pedido</h2>
      <div class="pedido-container">
        <h3>Menú Disponible</h3>
        <div class="menu-items">
          <div class="menu-category">
            <h4>Entradas</h4>
            <div class="menu-item">
              <span class="item-name">Ceviche de Camarones</span>
              <span class="item-price">$15.000</span>
              <button class="add-button">Añadir</button>
            </div>
            <div class="menu-item">
              <span class="item-name">Ensalada César</span>
              <span class="item-price">$12.000</span>
              <button class="add-button">Añadir</button>
            </div>
          </div>

          <div class="menu-category">
            <h4>Platos Principales</h4>
            <div class="menu-item">
              <span class="item-name">Filete de Res</span>
              <span class="item-price">$28.000</span>
              <button class="add-button">Añadir</button>
            </div>
            <div class="menu-item">
              <span class="item-name">Pollo a la Plancha</span>
              <span class="item-price">$22.000</span>
              <button class="add-button">Añadir</button>
            </div>
          </div>
        </div>

        <div class="pedido-resumen">
          <h3>Tu Pedido</h3>
          <div class="pedido-items">
            <p class="no-items">No has añadido items a tu pedido.</p>
          </div>
          <div class="pedido-total">
            <span>Total:</span>
            <span class="total-price">$0</span>
          </div>
          <button class="confirm-button">Confirmar Pedido</button>
        </div>
      </div>
    </div>
  `,  styles: [`
    .container {
      padding: 0;
      max-width: 1000px;
      margin: 0 auto;
    }

    h2, h3, h4 {
      color: #ffcc29;
    }

    .pedido-container {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      margin-top: 20px;
    }

    .menu-items {
      background: #222;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #ffcc29;
    }

    .menu-category {
      margin-bottom: 25px;
    }

    .menu-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      background: #303030;
      margin-bottom: 10px;
      border-radius: 8px;
    }

    .item-name {
      flex: 1;
      color: #fff;
    }

    .item-price {
      color: #ffcc29;
      font-weight: bold;
      margin: 0 15px;
    }

    .add-button {
      padding: 6px 12px;
      background: #ffcc29;
      color: #181818;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .add-button:hover {
      background: #ffdd54;
      box-shadow: 0 0 8px #ffcc29;
    }    .pedido-resumen {
      background: #222;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #ffcc29;
      height: fit-content;
    }

    .pedido-items {
      min-height: 200px;
      margin-bottom: 20px;
    }

    .no-items {
      text-align: center;
      color: #888;
      margin-top: 50px;
    }

    .pedido-total {
      display: flex;
      justify-content: space-between;
      padding: 15px 0;
      border-top: 1px solid #333;
      margin-bottom: 20px;
      color: #fff;
    }

    .total-price {
      color: #ffcc29;
      font-weight: bold;
      font-size: 1.2rem;
    }

    .confirm-button {
      width: 100%;
      padding: 12px;
      background: #ffcc29;
      color: #181818;
      border: none;
      border-radius: 8px;
      font-weight: bold;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .confirm-button:hover {
      background: #ffdd54;
      box-shadow: 0 0 8px #ffcc29;
    }

    @media (max-width: 768px) {
      .pedido-container {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PedidosComponent {}
