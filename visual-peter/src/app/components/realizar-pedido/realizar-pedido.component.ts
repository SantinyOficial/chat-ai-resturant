import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, MenuItem } from '../../services/menu.service';
import { PedidoService, Pedido, PedidoItem, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="realizar-pedido-container">
      <div class="pedido-header">
        <h3>Realizar Pedido</h3>
        <button class="close-btn" (click)="cerrar()">&times;</button>
      </div>

      <div class="pedido-content">
        <div class="menu-section">
          <div class="menu-filter">
            <button class="filter-btn" [class.active]="selectedCategory === 'all'" (click)="filterCategory('all')">Todos</button>
            <button class="filter-btn" [class.active]="selectedCategory === 'entrada'" (click)="filterCategory('entrada')">Entradas</button>
            <button class="filter-btn" [class.active]="selectedCategory === 'principal'" (click)="filterCategory('principal')">Platos Principales</button>
            <button class="filter-btn" [class.active]="selectedCategory === 'postre'" (click)="filterCategory('postre')">Postres</button>
            <button class="filter-btn" [class.active]="selectedCategory === 'bebida'" (click)="filterCategory('bebida')">Bebidas</button>
          </div>

          <div class="menu-items-container">
            <div class="menu-category" *ngIf="showCategory('entrada')">
              <h4>Entradas</h4>
              <div class="menu-item" *ngFor="let item of getItemsByCategory('entrada')">
                <span class="item-name">{{item.nombre}}</span>
                <span class="item-price">{{item.precio | currency:'COP':'symbol':'1.0-0'}}</span>
                <button class="add-button" (click)="addToOrder(item)">Añadir</button>
              </div>
            </div>

            <div class="menu-category" *ngIf="showCategory('principal')">
              <h4>Platos Principales</h4>
              <div class="menu-item" *ngFor="let item of getItemsByCategory('principal')">
                <span class="item-name">{{item.nombre}}</span>
                <span class="item-price">{{item.precio | currency:'COP':'symbol':'1.0-0'}}</span>
                <button class="add-button" (click)="addToOrder(item)">Añadir</button>
              </div>
            </div>

            <div class="menu-category" *ngIf="showCategory('postre')">
              <h4>Postres</h4>
              <div class="menu-item" *ngFor="let item of getItemsByCategory('postre')">
                <span class="item-name">{{item.nombre}}</span>
                <span class="item-price">{{item.precio | currency:'COP':'symbol':'1.0-0'}}</span>
                <button class="add-button" (click)="addToOrder(item)">Añadir</button>
              </div>
            </div>

            <div class="menu-category" *ngIf="showCategory('bebida')">
              <h4>Bebidas</h4>
              <div class="menu-item" *ngFor="let item of getItemsByCategory('bebida')">
                <span class="item-name">{{item.nombre}}</span>
                <span class="item-price">{{item.precio | currency:'COP':'symbol':'1.0-0'}}</span>
                <button class="add-button" (click)="addToOrder(item)">Añadir</button>
              </div>
            </div>
          </div>
        </div>

        <div class="pedido-resumen">
          <h4>Tu Pedido</h4>
          <div class="cliente-info">
            <div class="form-group">
              <label for="clienteNombre">Nombre:</label>
              <input type="text" id="clienteNombre" [(ngModel)]="currentPedido.clienteNombre" placeholder="Su nombre">
            </div>
            <div class="form-group">
              <label for="mesa">Mesa:</label>
              <input type="number" id="mesa" [(ngModel)]="currentPedido.mesa" placeholder="Número de mesa">
            </div>
          </div>

          <div class="pedido-items">
            <ng-container *ngIf="currentPedido.items.length === 0">
              <p class="no-items">No has añadido items a tu pedido.</p>
            </ng-container>
            <div class="order-item" *ngFor="let item of currentPedido.items; let i = index">
              <div class="item-details">
                <span class="item-quantity">
                  <button class="quantity-btn" (click)="decreaseQuantity(i)">-</button>
                  {{item.cantidad}}
                  <button class="quantity-btn" (click)="increaseQuantity(i)">+</button>
                </span>
                <span class="item-name">{{item.nombre}}</span>
                <span class="item-price">{{item.precio * item.cantidad | currency:'COP':'symbol':'1.0-0'}}</span>
              </div>
              <button class="remove-btn" (click)="removeItem(i)">✕</button>
            </div>
          </div>

          <div class="form-group observaciones">
            <label for="observaciones">Observaciones:</label>
            <textarea id="observaciones" [(ngModel)]="currentPedido.observaciones" placeholder="Especificaciones adicionales del pedido"></textarea>
          </div>

          <div class="pedido-total">
            <span>Total:</span>
            <span class="total-price">{{currentPedido.total | currency:'COP':'symbol':'1.0-0'}}</span>
          </div>

          <button class="confirm-button" [disabled]="!canConfirmOrder()" (click)="confirmOrder()">Confirmar Pedido</button>

          <div class="order-status" *ngIf="orderStatus">
            <div class="status-message {{orderStatus.toLowerCase()}}">{{orderStatusMessage}}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .realizar-pedido-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.85);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      padding: 20px;
      overflow-y: auto;
    }

    .pedido-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .pedido-header h3 {
      color: #ffcc29;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
    }

    .pedido-content {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      max-width: 1000px;
      margin: 0 auto;
      width: 100%;
    }

    .menu-section {
      display: flex;
      flex-direction: column;
    }

    .menu-filter {
      display: flex;
      gap: 10px;
      margin-bottom: 15px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 6px 12px;
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

    .menu-items-container {
      background: #222;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #ffcc29;
      overflow-y: auto;
      max-height: 500px;
    }

    .menu-category {
      margin-bottom: 25px;
    }

    .menu-category h4 {
      color: #ffcc29;
      margin-top: 0;
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
    }

    .pedido-resumen {
      background: #222;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border: 2px solid #ffcc29;
      height: fit-content;
    }

    .pedido-resumen h4 {
      color: #ffcc29;
      margin-top: 0;
    }

    .cliente-info {
      margin-bottom: 15px;
    }

    .form-group {
      margin-bottom: 10px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      color: #fff;
    }

    .form-group input, .form-group textarea {
      width: 100%;
      padding: 8px;
      background: #333;
      border: 1px solid #444;
      color: #fff;
      border-radius: 4px;
    }

    .observaciones textarea {
      min-height: 60px;
      resize: vertical;
    }

    .pedido-items {
      min-height: 100px;
      margin-bottom: 20px;
      max-height: 250px;
      overflow-y: auto;
    }

    .no-items {
      text-align: center;
      color: #888;
      margin-top: 30px;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      background: #303030;
      margin-bottom: 8px;
      border-radius: 4px;
    }

    .item-details {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .item-quantity {
      display: flex;
      align-items: center;
      margin-right: 10px;
      min-width: 70px;
    }

    .quantity-btn {
      width: 24px;
      height: 24px;
      background: #444;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .quantity-btn:hover {
      background: #555;
    }

    .remove-btn {
      background: none;
      border: none;
      color: #ff5252;
      cursor: pointer;
      font-size: 16px;
    }

    .remove-btn:hover {
      color: #ff0000;
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

    .confirm-button:hover:not(:disabled) {
      background: #ffdd54;
      box-shadow: 0 0 8px #ffcc29;
    }

    .confirm-button:disabled {
      background: #444;
      color: #777;
      cursor: not-allowed;
    }

    .order-status {
      margin-top: 15px;
    }

    .status-message {
      text-align: center;
      padding: 10px;
      border-radius: 4px;
      font-weight: bold;
    }

    .status-message.success {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .status-message.error {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .status-message.pending {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    @media (max-width: 768px) {
      .pedido-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RealizarPedidoComponent {
  @Input() clienteId: string = '';
  @Output() pedidoCreado = new EventEmitter<Pedido>();
  @Output() cerrarModal = new EventEmitter<void>();

  // Categoría seleccionada para filtrar el menú
  selectedCategory: string = 'all';
  // Elementos del menú obtenidos del servicio
  menuItems: MenuItem[] = [];
  // Pedido actual que se está configurando
  currentPedido: Pedido;
  // Mensaje de estado al realizar un pedido
  orderStatus: 'success' | 'error' | 'pending' | null = null;
  orderStatusMessage: string = '';

  constructor(
    private menuService: MenuService,
    private pedidoService: PedidoService
  ) {
    this.currentPedido = this.initPedido();
  }

  ngOnInit() {
    this.loadMenuItems();
    this.currentPedido.clienteId = this.clienteId;
  }

  // Inicializar un nuevo pedido
  initPedido(): Pedido {
    return {
      clienteNombre: '',
      clienteId: this.clienteId,
      mesa: 0,
      items: [],
      total: 0,
      estado: EstadoPedido.PENDIENTE,
      observaciones: ''
    };
  }

  // Cerrar el modal de realizar pedido
  cerrar() {
    this.cerrarModal.emit();
  }

  // Cargar los elementos del menú
  loadMenuItems() {
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        this.menuItems = menus.flatMap(menu => menu.items);
      },
      error: (err) => {
        console.error('Error al cargar los menús', err);
      }
    });
  }

  // Filtrar elementos por categoría
  filterCategory(category: string) {
    this.selectedCategory = category;
  }

  // Determinar si se debe mostrar una categoría
  showCategory(category: string): boolean {
    return this.selectedCategory === 'all' || this.selectedCategory === category;
  }

  // Obtener elementos por categoría
  getItemsByCategory(category: string): MenuItem[] {
    return this.menuItems.filter(item => item.categoria === category);
  }

  // Añadir un elemento al pedido
  addToOrder(menuItem: MenuItem) {
    const existingItemIndex = this.currentPedido.items.findIndex(
      item => item.nombre === menuItem.nombre
    );

    if (existingItemIndex !== -1) {
      // Si el ítem ya existe, incrementar la cantidad
      this.currentPedido.items[existingItemIndex].cantidad += 1;
    } else {
      // Si no existe, añadirlo
      const pedidoItem: PedidoItem = {
        nombre: menuItem.nombre,
        descripcion: menuItem.descripcion,
        categoria: menuItem.categoria,
        cantidad: 1,
        precio: menuItem.precio || 0
      };
      this.currentPedido.items.push(pedidoItem);
    }

    this.calculateTotal();
  }

  // Eliminar un elemento del pedido
  removeItem(index: number) {
    this.currentPedido.items.splice(index, 1);
    this.calculateTotal();
  }

  // Incrementar la cantidad de un elemento
  increaseQuantity(index: number) {
    this.currentPedido.items[index].cantidad += 1;
    this.calculateTotal();
  }

  // Decrementar la cantidad de un elemento
  decreaseQuantity(index: number) {
    if (this.currentPedido.items[index].cantidad > 1) {
      this.currentPedido.items[index].cantidad -= 1;
      this.calculateTotal();
    } else {
      this.removeItem(index);
    }
  }

  // Calcular el total del pedido
  calculateTotal() {
    this.currentPedido.total = this.currentPedido.items.reduce(
      (sum, item) => sum + (item.precio * item.cantidad), 0
    );
  }

  // Verificar si se puede confirmar el pedido
  canConfirmOrder(): boolean {
    return this.currentPedido.items.length > 0 &&
           this.currentPedido.clienteNombre.trim() !== '' &&
           this.currentPedido.mesa > 0;
  }

  // Confirmar el pedido
  confirmOrder() {
    this.orderStatus = 'pending';
    this.orderStatusMessage = 'Procesando pedido...';

    this.pedidoService.crearPedido(this.currentPedido).subscribe({
      next: (pedido) => {
        this.orderStatus = 'success';
        this.orderStatusMessage = 'Pedido realizado con éxito';

        // Emitir el pedido creado
        this.pedidoCreado.emit(pedido);

        // Reiniciar el pedido actual
        this.currentPedido = this.initPedido();

        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          this.cerrar();
        }, 2000);
      },
      error: (err) => {
        this.orderStatus = 'error';
        this.orderStatusMessage = 'Error al realizar el pedido. Inténtelo de nuevo.';
        console.error('Error al crear pedido', err);
      }
    });
  }
}
