import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService, MenuItem } from '../../services/menu.service';
import { PedidoService, Pedido, PedidoItem, EstadoPedido } from '../../services/pedido.service';

@Component({
  selector: 'app-realizar-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './realizar-pedido.component.html',
  styleUrls: ['./realizar-pedido.component.scss']
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

    // Asegurarse de que se está usando el mismo ID de cliente
    if (!this.clienteId) {
      this.clienteId = localStorage.getItem('clienteId') ||
                        ('cliente-' + Math.floor(Math.random() * 1000));
    }

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
