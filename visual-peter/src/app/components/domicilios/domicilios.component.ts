import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  DomicilioService,
  EstadoDomicilio,
  TipoVehiculo,
  SeguimientoDomicilio,
  Domiciliario,
  ConfiguracionDomicilio
} from '../../services/domicilio.service';

@Component({
  selector: 'app-domicilios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './domicilios.component.html',
  styleUrls: ['./domicilios.component.scss']
})
export class DomiciliosComponent implements OnInit, OnDestroy {

  //=================================
  // PROPIEDADES PÚBLICAS
  //=================================

  // Control de interfaz
  activeTab: string = 'seguimiento';
  mensajeEstado: string = '';
  tipoMensaje: string = '';

  // Estados de carga
  loadingDomicilios: boolean = false;
  loadingDomiciliarios: boolean = false;
  guardandoConfig: boolean = false;

  // Enums para template
  readonly EstadoDomicilio = EstadoDomicilio;
  readonly TipoVehiculo = TipoVehiculo;

  // Datos principales
  domicilios: SeguimientoDomicilio[] = [];
  domiciliosFiltrados: SeguimientoDomicilio[] = [];
  domiciliarios: Domiciliario[] = [];
  filtroEstado: string = '';

  // Configuración del sistema
  configuracion: ConfiguracionDomicilio = {
    distanciaMaxima: 10,
    costoBase: 3000,
    costoPorKm: 1000,
    tiempoEstimadoPorKm: 5,
    horarioInicio: '06:00',
    horarioFin: '23:00',
    zonasCovertura: [
      { nombre: 'Centro', poligono: [], costoAdicional: 0, disponible: true },
      { nombre: 'Norte', poligono: [], costoAdicional: 2000, disponible: true },
      { nombre: 'Sur', poligono: [], costoAdicional: 1500, disponible: true }
    ]
  };

  //=================================
  // PROPIEDADES PRIVADAS
  //=================================

  private subscriptions: Subscription = new Subscription();
  private intervaloActualizacion: any;
  private readonly INTERVALO_ACTUALIZACION = 30000; // 30 segundos

  //=================================
  // CONSTRUCTOR Y LIFECYCLE
  //=================================

  constructor(private domicilioService: DomicilioService) {}

  ngOnInit(): void {
    this.inicializarComponente();
  }

  ngOnDestroy(): void {
    this.limpiarRecursos();
  }
    //=================================
  // MÉTODOS DE INICIALIZACIÓN
  //=================================

  private inicializarComponente(): void {
    this.cargarDatosIniciales();
    this.iniciarActualizacionAutomatica();
  }

  private cargarDatosIniciales(): void {
    this.cargarDomicilios();
    this.cargarDomiciliarios();
    this.cargarConfiguracion();
  }

  private iniciarActualizacionAutomatica(): void {
    this.intervaloActualizacion = setInterval(() => {
      this.actualizarDatosSegunTab();
    }, this.INTERVALO_ACTUALIZACION);
  }

  private actualizarDatosSegunTab(): void {
    switch (this.activeTab) {
      case 'seguimiento':
        this.cargarDomicilios();
        break;
      case 'domiciliarios':
      case 'mapa':
        this.cargarDomiciliarios();
        break;
    }
  }

  private limpiarRecursos(): void {
    if (this.intervaloActualizacion) {
      clearInterval(this.intervaloActualizacion);
    }
    this.subscriptions.unsubscribe();
  }
    //=================================
  // NAVEGACIÓN DE PESTAÑAS
  //=================================

  cambiarTab(tab: string): void {
    this.activeTab = tab;
    this.cargarDatosSegunTab(tab);
  }

  private cargarDatosSegunTab(tab: string): void {
    switch (tab) {
      case 'seguimiento':
        this.cargarDomicilios();
        break;
      case 'domiciliarios':
      case 'mapa':
        this.cargarDomiciliarios();
        break;
      case 'configuracion':
        this.cargarConfiguracion();
        break;
    }
  }
  //=================================
  // GESTIÓN DE DATOS
  //=================================

  cargarDomicilios(): void {
    this.loadingDomicilios = true;

    const subscription = this.domicilioService.getPedidosDomicilioPendientes().subscribe({
      next: (pedidos: any[]) => {
        // Convertir pedidos a seguimientos para mostrar
        this.domicilios = pedidos.map(pedido => ({
          pedidoId: pedido.id,
          estado: pedido.estado || EstadoDomicilio.PENDIENTE,
          domiciliario: pedido.domiciliarioAsignado,
          ubicacionActual: pedido.domiciliarioAsignado?.ubicacionActual,
          tiempoEstimadoEntrega: pedido.tiempoEstimado?.toString(),
          direccionDestino: pedido.direccionEntrega,
          observaciones: pedido.observaciones,
          historial: []
        }));
        this.filtrarDomicilios();
        this.loadingDomicilios = false;
      },
      error: (error: any) => {
        console.error('Error al cargar domicilios:', error);
        this.loadingDomicilios = false;
        this.mostrarMensaje('Error al cargar domicilios', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  cargarDomiciliarios(): void {
    this.loadingDomiciliarios = true;

    const subscription = this.domicilioService.getAllDomiciliarios().subscribe({
      next: (domiciliarios: Domiciliario[]) => {
        this.domiciliarios = domiciliarios;
        this.loadingDomiciliarios = false;
      },
      error: (error: any) => {
        console.error('Error al cargar domiciliarios:', error);
        this.loadingDomiciliarios = false;
        this.mostrarMensaje('Error al cargar domiciliarios', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  private cargarConfiguracion(): void {
    const subscription = this.domicilioService.getConfiguracion().subscribe({
      next: (config: ConfiguracionDomicilio) => {
        this.configuracion = config;
      },
      error: (error: any) => {
        console.error('Error al cargar configuración:', error);
        this.mostrarMensaje('Error al cargar configuración', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  filtrarDomicilios(): void {
    if (this.filtroEstado) {
      this.domiciliosFiltrados = this.domicilios.filter(d => d.estado === this.filtroEstado);
    } else {
      this.domiciliosFiltrados = [...this.domicilios];
    }
  }
  //=================================
  // ACCIONES DE DOMICILIOS
  //=================================

  asignarDomiciliario(pedidoId: string): void {
    const subscription = this.domicilioService.getDomiciliariosDisponibles().subscribe({
      next: (domiciliariosDisponibles: Domiciliario[]) => {
        if (domiciliariosDisponibles.length > 0) {
          const domiciliario = domiciliariosDisponibles[0];
          const asignacionSub = this.domicilioService.asignarDomiciliario(pedidoId, domiciliario.id).subscribe({
            next: (resultado: any) => {
              if (resultado.success) {
                this.mostrarMensaje(`Domiciliario asignado: ${domiciliario.nombre}`, 'success');
                this.cargarDomicilios();
              } else {
                this.mostrarMensaje(resultado.mensaje || 'Error al asignar domiciliario', 'error');
              }
            },
            error: (error: any) => {
              console.error('Error al asignar domiciliario:', error);
              this.mostrarMensaje('Error al asignar domiciliario', 'error');
            }
          });
          this.subscriptions.add(asignacionSub);
        } else {
          this.mostrarMensaje('No hay domiciliarios disponibles en este momento', 'error');
        }
      },
      error: (error: any) => {
        console.error('Error al obtener domiciliarios disponibles:', error);
        this.mostrarMensaje('Error al buscar domiciliarios disponibles', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  reasignarDomiciliario(pedidoId: string): void {
    // Implementar lógica de reasignación
    this.mostrarMensaje('Funcionalidad de reasignación en desarrollo', 'info');
  }

  iniciarDomicilio(pedidoId: string): void {
    const subscription = this.domicilioService.actualizarEstadoDomicilio(pedidoId, EstadoDomicilio.EN_CAMINO)
      .subscribe({
        next: () => {
          this.mostrarMensaje('Domicilio iniciado exitosamente', 'success');
          this.cargarDomicilios();
        },
        error: (error: any) => {
          console.error('Error al iniciar domicilio:', error);
          this.mostrarMensaje('Error al iniciar domicilio', 'error');
        }
      });

    this.subscriptions.add(subscription);
  }

  completarDomicilio(pedidoId: string): void {
    const subscription = this.domicilioService.marcarPedidoEntregado(pedidoId).subscribe({
      next: () => {
        this.mostrarMensaje('Domicilio completado exitosamente', 'success');
        this.cargarDomicilios();
      },
      error: (error: any) => {
        console.error('Error al completar domicilio:', error);
        this.mostrarMensaje('Error al completar domicilio', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  cancelarDomicilio(pedidoId: string): void {
    const subscription = this.domicilioService.cancelarDomicilio(pedidoId, 'Cancelado por el restaurante').subscribe({
      next: () => {
        this.mostrarMensaje('Domicilio cancelado', 'success');
        this.cargarDomicilios();
      },
      error: (error: any) => {
        console.error('Error al cancelar domicilio:', error);
        this.mostrarMensaje('Error al cancelar domicilio', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  verSeguimiento(pedidoId: string): void {
    const subscription = this.domicilioService.obtenerSeguimiento(pedidoId).subscribe({
      next: (seguimiento: SeguimientoDomicilio) => {
        const lat = seguimiento.ubicacionActual?.latitud || 'N/A';
        const lng = seguimiento.ubicacionActual?.longitud || 'N/A';
        this.mostrarMensaje(`Última ubicación: ${lat}, ${lng}`, 'info');
      },
      error: (error: any) => {
        console.error('Error al obtener seguimiento:', error);
        this.mostrarMensaje('Error al obtener seguimiento', 'error');
      }
    });

    this.subscriptions.add(subscription);
  }

  calificarServicio(pedidoId: string): void {
    // Implementar modal de calificación
    this.mostrarMensaje('Modal de calificación en desarrollo', 'info');
  }
  //=================================
  // ACCIONES DE DOMICILIARIOS
  //=================================

  toggleEstadoDomiciliario(domiciliarioId: string): void {
    const domiciliario = this.domiciliarios.find(d => d.id === domiciliarioId);
    if (domiciliario) {
      domiciliario.disponible = !domiciliario.disponible;
      const estado = domiciliario.disponible ? 'activado' : 'desactivado';
      this.mostrarMensaje(`Domiciliario ${estado}`, 'success');
    }
  }

  verDetalleDomiciliario(domiciliarioId: string): void {
    const domiciliario = this.domiciliarios.find(d => d.id === domiciliarioId);
    if (domiciliario) {
      const pedidos = domiciliario.pedidosAsignados || 0;
      const calificacion = domiciliario.calificacion || 'N/A';
      this.mostrarMensaje(`Pedidos asignados: ${pedidos}, Calificación: ${calificacion}/5`, 'info');
    }
  }

  verUbicacionDomiciliario(domiciliarioId: string): void {
    // Implementación para mostrar ubicación del domiciliario
    console.log('Ver ubicación del domiciliario:', domiciliarioId);
    this.mostrarMensaje('Función de ubicación en desarrollo', 'info');
  }

  abrirFormularioDomiciliario(): void {
    // Implementar modal para agregar domiciliario
    this.mostrarMensaje('Formulario de domiciliario en desarrollo', 'info');
  }

  //=================================
  // FUNCIONES DEL MAPA
  //=================================

  actualizarMapa(): void {
    this.cargarDomiciliarios();
    this.mostrarMensaje('Mapa actualizado', 'success');
  }

  centrarMapa(): void {
    this.mostrarMensaje('Mapa centrado en la ubicación del restaurante', 'info');
  }

  //=================================
  // GESTIÓN DE CONFIGURACIÓN
  //=================================

  guardarConfiguracion(): void {
    this.guardandoConfig = true;

    const subscription = this.domicilioService.actualizarConfiguracion(this.configuracion).subscribe({
      next: () => {
        this.mostrarMensaje('Configuración guardada exitosamente', 'success');
        this.guardandoConfig = false;
      },
      error: (error: any) => {
        console.error('Error al guardar configuración:', error);
        this.mostrarMensaje('Error al guardar la configuración', 'error');
        this.guardandoConfig = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  agregarZona(): void {
    this.configuracion.zonasCovertura.push({
      nombre: '',
      poligono: [],
      costoAdicional: 0,
      disponible: true
    });
  }

  eliminarZona(index: number): void {
    this.configuracion.zonasCovertura.splice(index, 1);
  }
  //=================================
  // MÉTODOS UTILITARIOS PARA TEMPLATE
  //=================================

  getDomiciliariosActivos(): number {
    return this.domiciliarios.filter(d => d.disponible).length;
  }

  getDomiciliariosOcupados(): number {
    return this.domiciliarios.filter(d => d.pedidosAsignados > 0).length;
  }

  getCalificacionPromedio(): string {
    if (this.domiciliarios.length === 0) return '0.0';
    const suma = this.domiciliarios.reduce((acc, d) => acc + (d.calificacion || 0), 0);
    return (suma / this.domiciliarios.length).toFixed(1);
  }

  getDomiciliariosActivosList(): Domiciliario[] {
    return this.domiciliarios.filter(d => d.disponible);
  }

  isStepCompleted(estadoActual: EstadoDomicilio, estadoEvaluado: string): boolean {
    const estados = ['PENDIENTE', 'ASIGNADO', 'EN_CAMINO', 'ENTREGADO'];
    const indiceActual = estados.indexOf(estadoActual);
    const indiceEvaluado = estados.indexOf(estadoEvaluado);
    return indiceActual >= indiceEvaluado;
  }

  getEstadoLabel(estado: EstadoDomicilio): string {
    const labels: { [key in EstadoDomicilio]: string } = {
      [EstadoDomicilio.PENDIENTE]: 'Pendiente',
      [EstadoDomicilio.ASIGNADO]: 'Asignado',
      [EstadoDomicilio.EN_CAMINO]: 'En Camino',
      [EstadoDomicilio.ENTREGADO]: 'Entregado',
      [EstadoDomicilio.CANCELADO]: 'Cancelado',
      [EstadoDomicilio.DEVUELTO]: 'Devuelto'
    };
    return labels[estado] || estado;
  }

  getTipoVehiculoLabel(tipo: TipoVehiculo): string {
    const labels: { [key in TipoVehiculo]: string } = {
      [TipoVehiculo.MOTO]: 'Motocicleta',
      [TipoVehiculo.BICICLETA]: 'Bicicleta',
      [TipoVehiculo.CARRO]: 'Automóvil',
      [TipoVehiculo.PIE]: 'A pie'
    };
    return labels[tipo] || tipo;
  }

  //=================================
  // SISTEMA DE MENSAJES
  //=================================

  private mostrarMensaje(mensaje: string, tipo: string): void {
    this.mensajeEstado = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensajeEstado = '';
    }, 5000);
  }
}
