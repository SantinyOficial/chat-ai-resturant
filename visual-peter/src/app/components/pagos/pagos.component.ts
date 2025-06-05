import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService, MetodoPago, EstadoPago, Pago, DatosTarjeta, DatosNequi, DatosPSE, DatosDaviplata, ResultadoPago } from '../../services/pago.service';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.scss']
})
export class PagosComponent implements OnInit {
  // Estados y variables principales
  activeTab: string = 'procesar';
  procesando: boolean = false;
  loadingPagos: boolean = false;
  mensajeEstado: string = '';
  tipoMensaje: string = '';

  // Enums para el template
  MetodoPago = MetodoPago;
  EstadoPago = EstadoPago;

  // Datos del nuevo pago
  nuevoPago: Partial<Pago> = {
    pedidoId: '',
    monto: 0,
    metodoPago: MetodoPago.EFECTIVO
  };
  // Datos específicos por método
  datosTarjeta: DatosTarjeta = {
    numeroTarjeta: '',
    nombreTarjeta: '',
    mesExpiracion: 0,
    anoExpiracion: 0,
    cvv: ''
  };

  datosNequi: DatosNequi = {
    telefono: '',
    codigoVerificacion: ''
  };

  datosPSE: DatosPSE = {
    banco: '',
    tipoDocumento: '',
    numeroDocumento: '',
    email: ''
  };

  datosDaviplata: DatosDaviplata = {
    telefono: '',
    pin: ''
  };

  // Datos para historial
  pagos: Pago[] = [];
  pagosFiltrados: Pago[] = [];
  filtroEstado: string = '';

  // Estadísticas
  estadisticas = {
    totalPagos: 0,
    montoTotal: 0,
    pagosAprobados: 0,
    pagosRechazados: 0,
    tasaExito: 0,
    metodosPorUso: [] as { metodo: MetodoPago, cantidad: number }[]
  };

  constructor(private pagoService: PagoService) {}

  ngOnInit() {
    this.cargarPagos();
    this.cargarEstadisticas();
  }

  // Cambiar pestaña activa
  cambiarTab(tab: string) {
    this.activeTab = tab;
    if (tab === 'historial') {
      this.cargarPagos();
    } else if (tab === 'estadisticas') {
      this.cargarEstadisticas();
    }
  }

  // Seleccionar método de pago
  seleccionarMetodo(metodo: MetodoPago) {
    this.nuevoPago.metodoPago = metodo;
    this.limpiarDatosMetodo();
  }
  // Limpiar datos específicos del método
  limpiarDatosMetodo() {
    this.datosTarjeta = { numeroTarjeta: '', nombreTarjeta: '', mesExpiracion: 0, anoExpiracion: 0, cvv: '' };
    this.datosNequi = { telefono: '', codigoVerificacion: '' };
    this.datosPSE = { banco: '', tipoDocumento: '', numeroDocumento: '', email: '' };
    this.datosDaviplata = { telefono: '', pin: '' };
  }

  // Procesar pago
  async procesarPago() {
    if (!this.validarFormulario()) {
      this.mostrarMensaje('Por favor complete todos los campos requeridos', 'error');
      return;
    }

    this.procesando = true;
    this.mensajeEstado = '';

    try {
      let resultado: ResultadoPago | undefined;

      switch (this.nuevoPago.metodoPago) {
        case MetodoPago.EFECTIVO:
          resultado = await this.pagoService.procesarPagoEfectivo(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!
          ).toPromise();
          break;

        case MetodoPago.TARJETA_CREDITO:
          resultado = await this.pagoService.procesarPagoTarjeta(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!,
            this.datosTarjeta
          ).toPromise();
          break;

        case MetodoPago.TARJETA_DEBITO:
          resultado = await this.pagoService.procesarPagoTarjeta(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!,
            this.datosTarjeta
          ).toPromise();
          break;

        case MetodoPago.NEQUI:
          resultado = await this.pagoService.procesarPagoNequi(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!,
            this.datosNequi
          ).toPromise();
          break;

        case MetodoPago.PSE:
          resultado = await this.pagoService.procesarPagoPSE(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!,
            this.datosPSE
          ).toPromise();
          break;

        case MetodoPago.DAVIPLATA:
          resultado = await this.pagoService.procesarPagoDaviplata(
            this.nuevoPago.pedidoId!,
            this.nuevoPago.monto!,
            this.datosDaviplata
          ).toPromise();
          break;

        default:
          throw new Error('Método de pago no válido');
      }

      if (resultado && resultado.success) {
        this.mostrarMensaje(`Pago procesado exitosamente. ID: ${resultado.pago?.id || 'N/A'}`, 'success');
        this.limpiarFormulario();
        this.cargarPagos(); // Actualizar historial
      } else {
        this.mostrarMensaje(`Error en el pago: ${resultado?.mensaje || 'Error desconocido'}`, 'error');
      }

    } catch (error) {
      console.error('Error al procesar pago:', error);
      this.mostrarMensaje('Error interno al procesar el pago', 'error');
    } finally {
      this.procesando = false;
    }
  }

  // Validar formulario
  validarFormulario(): boolean {
    if (!this.nuevoPago.pedidoId || !this.nuevoPago.monto || !this.nuevoPago.metodoPago) {
      return false;
    }    switch (this.nuevoPago.metodoPago) {
      case MetodoPago.TARJETA_CREDITO:
      case MetodoPago.TARJETA_DEBITO:
        return !!(this.datosTarjeta.numeroTarjeta && this.datosTarjeta.cvv &&
                 this.datosTarjeta.mesExpiracion && this.datosTarjeta.anoExpiracion &&
                 this.datosTarjeta.nombreTarjeta);

      case MetodoPago.NEQUI:
        return !!(this.datosNequi.telefono && this.datosNequi.codigoVerificacion);

      case MetodoPago.PSE:
        return !!(this.datosPSE.banco && this.datosPSE.tipoDocumento &&
                 this.datosPSE.numeroDocumento && this.datosPSE.email);

      case MetodoPago.DAVIPLATA:
        return !!(this.datosDaviplata.telefono && this.datosDaviplata.pin);

      case MetodoPago.EFECTIVO:
        return true;

      default:
        return false;
    }
  }

  // Cancelar pago actual
  cancelarPago() {
    this.limpiarFormulario();
    this.mensajeEstado = '';
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.nuevoPago = {
      pedidoId: '',
      monto: 0,
      metodoPago: MetodoPago.EFECTIVO
    };
    this.limpiarDatosMetodo();
  }
  // Cargar historial de pagos
  cargarPagos() {
    this.loadingPagos = true;
    // Usar el método de simulación para MVP
    this.pagoService.getHistorialPagosSimulados().subscribe({
      next: (pagos: Pago[]) => {
        this.pagos = pagos;
        this.filtrarPagos();
        this.loadingPagos = false;
      },
      error: (error: any) => {
        console.error('Error al cargar pagos:', error);
        this.loadingPagos = false;
        // En caso de error, inicializamos con un array vacío
        this.pagos = [];
        this.pagosFiltrados = [];
      }
    });
  }

  // Filtrar pagos por estado
  filtrarPagos() {
    if (this.filtroEstado) {
      this.pagosFiltrados = this.pagos.filter(pago => pago.estado === this.filtroEstado);
    } else {
      this.pagosFiltrados = [...this.pagos];
    }
  }

  // Cargar estadísticas (método simplificado ya que no existe en el servicio)
  cargarEstadisticas() {
    // Calculamos estadísticas desde los datos cargados
    if (this.pagos.length > 0) {
      this.estadisticas.totalPagos = this.pagos.length;
      this.estadisticas.montoTotal = this.pagos.reduce((total, pago) => total + pago.monto, 0);
      this.estadisticas.pagosAprobados = this.pagos.filter(p => p.estado === EstadoPago.APROBADO).length;
      this.estadisticas.pagosRechazados = this.pagos.filter(p => p.estado === EstadoPago.RECHAZADO).length;
      this.estadisticas.tasaExito = Math.round((this.estadisticas.pagosAprobados / this.estadisticas.totalPagos) * 100);

      // Contar métodos por uso
      const metodoCount = new Map<MetodoPago, number>();
      this.pagos.forEach(pago => {
        metodoCount.set(pago.metodoPago, (metodoCount.get(pago.metodoPago) || 0) + 1);
      });

      this.estadisticas.metodosPorUso = Array.from(metodoCount.entries())
        .map(([metodo, cantidad]) => ({ metodo, cantidad }))
        .sort((a, b) => b.cantidad - a.cantidad);
    }
  }

  // Cancelar pago existente
  cancelarPagoExistente(pagoId: string) {
    this.pagoService.cancelarPago(pagoId).subscribe({
      next: () => {
        this.mostrarMensaje('Pago cancelado exitosamente', 'success');
        this.cargarPagos();
      },
      error: (error: any) => {
        console.error('Error al cancelar pago:', error);
        this.mostrarMensaje('Error al cancelar el pago', 'error');
      }
    });
  }

  // Reprocesar pago (usar verificarEstadoPago como alternativa)
  reprocesarPago(pagoId: string) {
    this.pagoService.verificarEstadoPago(pagoId).subscribe({
      next: (pago: Pago) => {
        if (pago.estado === EstadoPago.APROBADO) {
          this.mostrarMensaje('El pago ya está aprobado', 'success');
        } else {
          this.mostrarMensaje('Estado del pago verificado, por favor intente procesar nuevamente', 'info');
        }
        this.cargarPagos();
      },
      error: (error: any) => {
        console.error('Error al verificar pago:', error);
        this.mostrarMensaje('Error al verificar el estado del pago', 'error');
      }
    });
  }

  // Solicitar reembolso
  solicitarReembolso(pagoId: string) {
    this.pagoService.procesarReembolso(pagoId, undefined, 'Solicitud de reembolso del cliente').subscribe({
      next: () => {
        this.mostrarMensaje('Solicitud de reembolso enviada', 'success');
        this.cargarPagos();
      },
      error: (error: any) => {
        console.error('Error al solicitar reembolso:', error);
        this.mostrarMensaje('Error al solicitar el reembolso', 'error');
      }
    });
  }

  // Utilidades para el template
  getMeses() {
    return [
      { value: '01', label: 'Enero' },
      { value: '02', label: 'Febrero' },
      { value: '03', label: 'Marzo' },
      { value: '04', label: 'Abril' },
      { value: '05', label: 'Mayo' },
      { value: '06', label: 'Junio' },
      { value: '07', label: 'Julio' },
      { value: '08', label: 'Agosto' },
      { value: '09', label: 'Septiembre' },
      { value: '10', label: 'Octubre' },
      { value: '11', label: 'Noviembre' },
      { value: '12', label: 'Diciembre' }
    ];
  }

  getAnios() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i <= currentYear + 20; i++) {
      years.push(i);
    }
    return years;
  }

  getEstadoLabel(estado: EstadoPago): string {
    const labels = {
      [EstadoPago.PENDIENTE]: 'Pendiente',
      [EstadoPago.PROCESANDO]: 'Procesando',
      [EstadoPago.APROBADO]: 'Aprobado',
      [EstadoPago.RECHAZADO]: 'Rechazado',
      [EstadoPago.CANCELADO]: 'Cancelado',
      [EstadoPago.REEMBOLSADO]: 'Reembolsado'
    };
    return labels[estado] || estado;
  }

  getMetodoLabel(metodo: MetodoPago): string {
    const labels = {
      [MetodoPago.EFECTIVO]: 'Efectivo',
      [MetodoPago.TARJETA_CREDITO]: 'Tarjeta de Crédito',
      [MetodoPago.TARJETA_DEBITO]: 'Tarjeta de Débito',
      [MetodoPago.NEQUI]: 'Nequi',
      [MetodoPago.PSE]: 'PSE',
      [MetodoPago.DAVIPLATA]: 'Daviplata'
    };
    return labels[metodo] || metodo;
  }

  getMetodoMasUsado(): string {
    if (this.estadisticas.metodosPorUso.length === 0) return 'N/A';
    const metodoMasUsado = this.estadisticas.metodosPorUso[0];
    return this.getMetodoLabel(metodoMasUsado.metodo);
  }

  mostrarMensaje(mensaje: string, tipo: string) {
    this.mensajeEstado = mensaje;
    this.tipoMensaje = tipo;
    setTimeout(() => {
      this.mensajeEstado = '';
    }, 5000);
  }
}
