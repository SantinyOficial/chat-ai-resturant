import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MicropedidoService, Micropedido, OpcionMicropedido, TipoMicropedido, EstadoMicropedido, ItemMicropedido } from '../../services/micropedido.service';

@Component({
  selector: 'app-micropedidos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './micropedidos.component.html',
  styleUrls: ['./micropedidos.component.scss']
})
export class MicropedidosComponent implements OnInit {
  activeTab: string = 'crear';

  // Crear micropedido
  opciones: OpcionMicropedido[] = [];
  opcionesFiltradas: OpcionMicropedido[] = [];
  tipoSeleccionado: TipoMicropedido | null = null;
  itemsCarrito: ItemMicropedido[] = [];
  mesa: number = 0;
  observaciones: string = '';
  procesando: boolean = false;
  loadingOpciones: boolean = false;
  tiempoEstimadoTotal: number = 0;

  // Mis micropedidos
  misMicropedidos: Micropedido[] = [];
  micropedidosFiltrados: Micropedido[] = [];
  filtroEstado: EstadoMicropedido | null = null;
  loadingMicropedidos: boolean = false;

  // Sistema de notificaciones
  notificacionVisible: boolean = false;
  notificacionTitulo: string = '';
  notificacionMensaje: string = '';
  notificacionTipo: 'exito' | 'error' | 'info' = 'info';
  timeoutNotificacion: any;

  clienteId: string = 'cliente-actual'; // Esto vendría del servicio de autenticación

  constructor(private micropedidoService: MicropedidoService) {}

  ngOnInit() {
    this.loadOpciones();
  }

  loadOpciones() {
    this.loadingOpciones = true;
    this.micropedidoService.getOpcionesDisponibles().subscribe({
      next: (opciones: OpcionMicropedido[]) => {
        this.opciones = opciones;
        this.filtrarPorTipo(this.tipoSeleccionado);
        this.loadingOpciones = false;
      },
      error: (err: any) => {
        console.error('Error al cargar opciones:', err);
        this.loadingOpciones = false;
      }
    });
  }

  filtrarPorTipo(tipo: TipoMicropedido | null) {
    this.tipoSeleccionado = tipo;
    if (tipo === null) {
      this.opcionesFiltradas = this.opciones;
    } else {
      this.opcionesFiltradas = this.opciones.filter(opcion => opcion.tipo === tipo);
    }
  }

  agregarItem(opcion: OpcionMicropedido) {
    const itemExistente = this.itemsCarrito.find(item => item.nombre === opcion.nombre && item.tipo === opcion.tipo);

    if (itemExistente) {
      itemExistente.cantidad++;
    } else {
      const nuevoItem: ItemMicropedido = {
        nombre: opcion.nombre,
        precio: opcion.precio,
        cantidad: 1,
        tipo: opcion.tipo,
        observaciones: ''
      };
      this.itemsCarrito.push(nuevoItem);
    }

    this.calcularTiempoEstimado();
  }

  cambiarCantidad(index: number, cambio: number) {
    const item = this.itemsCarrito[index];
    item.cantidad += cambio;

    if (item.cantidad <= 0) {
      this.itemsCarrito.splice(index, 1);
    }

    this.calcularTiempoEstimado();
  }

  removerItem(index: number) {
    this.itemsCarrito.splice(index, 1);
    this.calcularTiempoEstimado();
  }

  calcularTotal(): number {
    return this.itemsCarrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  calcularTiempoEstimado() {
    // Usar el servicio para calcular el tiempo estimado
    if (this.itemsCarrito.length > 0) {
      this.micropedidoService.calcularTiempoEstimado(this.itemsCarrito).subscribe({
        next: (resultado) => {
          this.tiempoEstimadoTotal = resultado.tiempoMinutos;
        },
        error: (err) => {
          console.error('Error al calcular tiempo estimado:', err);
          // Fallback: calcular localmente basado en el tiempo de preparación de las opciones
          const tiempos = this.itemsCarrito.map(item => {
            const opcion = this.opciones.find(o => o.nombre === item.nombre && o.tipo === item.tipo);
            return opcion?.tiempoPreparacion || 5; // 5 minutos por defecto
          });
          this.tiempoEstimadoTotal = tiempos.length > 0 ? Math.max(...tiempos) : 0;
        }
      });
    } else {
      this.tiempoEstimadoTotal = 0;
    }
  }

  crearMicropedido() {
    if (this.itemsCarrito.length === 0 || this.mesa <= 0) {
      alert('Debes agregar items y especificar una mesa válida.');
      return;
    }

    this.procesando = true;

    const micropedido: Micropedido = {
      clienteId: this.clienteId,
      mesa: this.mesa,
      items: this.itemsCarrito,
      total: this.calcularTotal(),
      estado: EstadoMicropedido.PENDIENTE,
      tiempoEstimado: this.tiempoEstimadoTotal,
      observaciones: this.observaciones || undefined
    };

    this.micropedidoService.crearMicropedido(micropedido).subscribe({
      next: (resultado) => {
        console.log('Micropedido creado:', resultado);

        // Limpiar formulario
        this.itemsCarrito = [];
        this.mesa = 0;
        this.observaciones = '';
        this.tiempoEstimadoTotal = 0;

        // Cambiar a la pestaña de mis micropedidos
        this.activeTab = 'mis-micropedidos';
        this.loadMisMicropedidos();

        this.procesando = false;

        // Mostrar notificación elegante de éxito
        this.mostrarNotificacionExito(
          '¡Micropedido Creado!',
          `Tu pedido para la mesa ${this.mesa} está siendo preparado.`
        );
      },
      error: (err) => {
        console.error('Error al crear micropedido:', err);
        this.procesando = false;

        // Mostrar notificación elegante de error
        this.mostrarNotificacionError(
          'No se pudo crear el micropedido',
          'Por favor intenta nuevamente o contacta al mesero.'
        );
      }
    });
  }

  loadMisMicropedidos() {
    this.loadingMicropedidos = true;
    this.micropedidoService.getMicropedidosByCliente(this.clienteId).subscribe({
      next: (micropedidos) => {
        this.misMicropedidos = micropedidos.sort((a, b) =>
          new Date(b.fechaCreacion || '').getTime() - new Date(a.fechaCreacion || '').getTime()
        );
        this.filtrarPorEstado(this.filtroEstado);
        this.loadingMicropedidos = false;
      },
      error: (err) => {
        console.error('Error al cargar micropedidos:', err);
        this.loadingMicropedidos = false;
      }
    });
  }

  filtrarPorEstado(estado: EstadoMicropedido | null) {
    this.filtroEstado = estado;
    if (estado === null) {
      this.micropedidosFiltrados = this.misMicropedidos;
    } else {
      this.micropedidosFiltrados = this.misMicropedidos.filter(m => m.estado === estado);
    }
  }

  getEstadoTexto(estado: EstadoMicropedido): string {
    const textos = {
      'PENDIENTE': 'Pendiente',
      'PREPARANDO': 'Preparando',
      'LISTO': 'Listo',
      'ENTREGADO': 'Entregado',
      'CANCELADO': 'Cancelado'
    };
    return textos[estado] || estado;
  }

  getEstadoClase(estado: EstadoMicropedido): string {
    return `estado-${estado.toLowerCase()}`;
  }

  getTipoIcono(tipo: TipoMicropedido): string {
    const iconos = {
      'BEBIDA': '🥤',
      'SNACK': '🍿',
      'POSTRE': '🍰',
      'ACOMPANAMIENTO': '🍟'
    };
    return iconos[tipo] || '🍽️';
  }

  getTipoTexto(tipo: TipoMicropedido): string {
    const textos = {
      'BEBIDA': 'Bebida',
      'SNACK': 'Snack',
      'POSTRE': 'Postre',
      'ACOMPANAMIENTO': 'Acompañamiento'
    };
    return textos[tipo] || tipo;
  }

  getCantidadEnCarrito(opcion: OpcionMicropedido): number {
    const item = this.itemsCarrito.find(item => item.nombre === opcion.nombre && item.tipo === opcion.tipo);
    return item ? item.cantidad : 0;
  }

  puedeAgregarItem(opcion: OpcionMicropedido): boolean {
    return opcion.disponible;
  }

  puedeCancelar(micropedido: Micropedido): boolean {
    return micropedido.estado === EstadoMicropedido.PENDIENTE || micropedido.estado === EstadoMicropedido.PREPARANDO;
  }

  cancelarMicropedido(micropedido: Micropedido) {
    if (confirm('¿Estás seguro de que quieres cancelar este micropedido?')) {
      this.micropedidoService.cancelarMicropedido(micropedido.id!).subscribe({
        next: (resultado) => {
          console.log('Micropedido cancelado:', resultado);
          this.loadMisMicropedidos();
          this.mostrarNotificacionExito('Pedido cancelado', 'El micropedido se ha cancelado correctamente.');
        },
        error: (err) => {
          console.error('Error al cancelar micropedido:', err);
          this.mostrarNotificacionError('Error', 'No se pudo cancelar el micropedido en este momento.');
        }
      });
    }
  }

  // Métodos de notificación elegante para la demo
  mostrarNotificacionExito(titulo: string, mensaje: string): void {
    this.mostrarNotificacion(titulo, mensaje, 'exito');
  }

  mostrarNotificacionError(titulo: string, mensaje: string): void {
    this.mostrarNotificacion(titulo, mensaje, 'error');
  }

  mostrarNotificacion(titulo: string, mensaje: string, tipo: 'exito' | 'error' | 'info'): void {
    // Limpiar cualquier notificación previa
    if (this.timeoutNotificacion) {
      clearTimeout(this.timeoutNotificacion);
    }

    // Configurar la nueva notificación
    this.notificacionTitulo = titulo;
    this.notificacionMensaje = mensaje;
    this.notificacionTipo = tipo;
    this.notificacionVisible = true;

    // Auto-ocultar después de 4 segundos
    this.timeoutNotificacion = setTimeout(() => {
      this.notificacionVisible = false;
    }, 4000);
  }

  // Métodos auxiliares para el template
  get TipoMicropedido() {
    return TipoMicropedido;
  }

  get EstadoMicropedido() {
    return EstadoMicropedido;
  }

  get tiposDisponibles() {
    return Object.values(TipoMicropedido);
  }

  get estadosDisponibles() {
    return Object.values(EstadoMicropedido);
  }
}
