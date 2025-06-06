import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, HostListener, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PagoService, MetodoPago, ResultadoPago, DatosTarjeta, DatosNequi, DatosPSE, DatosDaviplata } from '../../services/pago.service';
import { EstadoPagoPedido } from '../../models/enums';

// Interfaz temporal para datos de pago
interface DatosPago {
  numeroTarjeta?: string;
  nombreTitular?: string;
  fechaExpiracion?: string;
  cvv?: string;
  telefono?: string;
  banco?: string;
  tipoDocumento?: string;
  numeroDocumento?: string;
  email?: string;
}

// Interfaz extendida para métodos de pago con efectos visuales
interface MetodoPagoExtendido {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  requiereDatos: boolean;
  tiempoEstimado: number;
  activo?: boolean;
  efectos?: string[];
}

@Component({
  selector: 'app-pago-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pago-cliente.component.html',
  styleUrls: ['./pago-cliente.component.scss']
})
export class PagoClienteComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() pedidoId!: string;
  @Input() monto!: number;
  @Input() estadoPago: EstadoPagoPedido = EstadoPagoPedido.PENDIENTE_PAGO;

  @Output() pagoCompletado = new EventEmitter<any>();
  @Output() pagoFallido = new EventEmitter<any>();
  @Output() estadoChanged = new EventEmitter<EstadoPagoPedido>();

  @ViewChild('canvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('audioContext', { static: false }) audioRef!: ElementRef<HTMLAudioElement>;

  // Estados y propiedades principales
  EstadoPagoPedido = EstadoPagoPedido;
  metodoSeleccionado: string | null = null;
  mostrarFormulario = false;
  datosPago: DatosPago = {};

  // Efectos de procesamiento avanzados
  porcentajeProcesamiento = 0;
  mensajeProcesamiento: 'iniciando' | 'validando' | 'conectando' | 'banco' | 'autorizando' | 'finalizando' = 'iniciando';
  intervaloProcesamiento: any;
  timeoutMensajes: any[] = [];
  animacionActiva = false;
  particulas: any[] = [];
  animationFrameId: any;

  // Audio y efectos de sonido
  audioContext: AudioContext | null = null;
  sonidosHabilitados = true;

  // Canvas para efectos visuales
  ctx: CanvasRenderingContext2D | null = null;
  canvasWidth = 0;
  canvasHeight = 0;

  // Métodos de pago disponibles
  metodosPago: MetodoPagoExtendido[] = [
    {
      id: 'efectivo',
      nombre: 'Efectivo',
      icono: '💵',
      descripcion: 'Pago al momento de la entrega',
      requiereDatos: false,
      tiempoEstimado: 1000,
      activo: true,
      efectos: ['pulse', 'glow']
    },
    {
      id: 'tarjeta',
      nombre: 'Tarjeta',
      icono: '💳',
      descripcion: 'Crédito/Débito seguro',
      requiereDatos: true,
      tiempoEstimado: 3000,
      activo: true,
      efectos: ['shimmer', 'rotate3d']
    },
    {
      id: 'nequi',
      nombre: 'Nequi',
      icono: '📱',
      descripcion: 'Pago móvil rápido',
      requiereDatos: true,
      tiempoEstimado: 2000,
      activo: true,
      efectos: ['bounce', 'wave']
    },
    {
      id: 'pse',
      nombre: 'PSE',
      icono: '🏦',
      descripcion: 'Débito bancario directo',
      requiereDatos: true,
      tiempoEstimado: 4000,
      activo: true,
      efectos: ['slide', 'fade']
    },
    {
      id: 'daviplata',
      nombre: 'Daviplata',
      icono: '💰',
      descripcion: 'Monedero digital Davivienda',
      requiereDatos: true,
      tiempoEstimado: 2500,
      activo: true,
      efectos: ['zoom', 'sparkle']
    }
  ];

  // Mensajes dinámicos para cada fase
  mensajesFases = {
    iniciando: [
      '🔒 Inicializando sistema de pagos seguro...',
      '⚡ Estableciendo conexión cifrada...',
      '🛡️ Verificando protocolos de seguridad...'
    ],
    validando: [
      '🔍 Validando información de pago...',
      '✅ Verificando datos del cliente...',
      '🔐 Confirmando autenticidad...'
    ],
    conectando: [
      '🌐 Conectando con red bancaria...',
      '📡 Estableciendo enlace seguro...',
      '🔗 Sincronizando con sistemas...'
    ],
    banco: [
      '🏛️ Procesando con entidad bancaria...',
      '💳 Verificando fondos disponibles...',
      '🔄 Autenticando transacción...'
    ],
    autorizando: [
      '⏳ Esperando autorización bancaria...',
      '🔑 Validando credenciales...',
      '✔️ Confirmando aprobación...'
    ],
    finalizando: [
      '🎉 Finalizando transacción exitosa...',
      '📋 Generando comprobante digital...',
      '✨ ¡Pago completado con éxito!'
    ]
  };

  constructor(
    private pagoService: PagoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.inicializarAudio();
    this.crearParticulasIniciales();
  }

  ngAfterViewInit() {
    this.inicializarCanvas();
    this.iniciarAnimacionParticulas();
  }

  ngOnDestroy() {
    this.limpiarIntervalos();
    this.limpiarAnimaciones();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.actualizarTamanoCanvas();
  }

  // ========================================
  // MÉTODOS DE INICIALIZACIÓN
  // ========================================

  private inicializarAudio() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.log('Audio no disponible:', error);
      this.sonidosHabilitados = false;
    }
  }

  private inicializarCanvas() {
    if (this.canvasRef?.nativeElement) {
      this.ctx = this.canvasRef.nativeElement.getContext('2d');
      this.actualizarTamanoCanvas();
    }
  }

  private actualizarTamanoCanvas() {
    if (this.canvasRef?.nativeElement) {
      const canvas = this.canvasRef.nativeElement;
      this.canvasWidth = canvas.offsetWidth;
      this.canvasHeight = canvas.offsetHeight;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
    }
  }

  private crearParticulasIniciales() {
    this.particulas = [];
    for (let i = 0; i < 20; i++) {
      this.particulas.push(this.crearParticula());
    }
  }

  private crearParticula() {
    return {
      x: Math.random() * this.canvasWidth,
      y: Math.random() * this.canvasHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.2,
      color: this.obtenerColorAleatorio(),
      life: Math.random() * 100 + 50,
      gravity: 0
    };
  }

  private obtenerColorAleatorio(): string {
    const colores = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
    return colores[Math.floor(Math.random() * colores.length)];
  }

  // ========================================
  // MÉTODOS DE SELECCIÓN Y PROCESAMIENTO
  // ========================================

  seleccionarMetodo(metodo: string) {
    this.metodoSeleccionado = metodo;
    this.mostrarFormulario = this.requiereFormulario(metodo);
    this.activarEfectoSeleccion(metodo);
    this.reproducirSonido('select');
    this.cdr.detectChanges();
  }

  private requiereFormulario(metodo: string): boolean {
    const metodoPago = this.metodosPago.find(m => m.id === metodo);
    return metodoPago?.requiereDatos || false;
  }

  private activarEfectoSeleccion(metodo: string) {
    const elemento = document.querySelector(`[data-metodo="${metodo}"]`);
    if (elemento) {
      elemento.classList.add('selected-bounce');
      setTimeout(() => {
        elemento.classList.remove('selected-bounce');
      }, 600);
    }
  }  async procesarPago() {
    if (!this.metodoSeleccionado || !this.validarDatos()) {
      this.mostrarError('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      // 🚨 ALERTA INICIAL: Procesando pago
      this.mostrarAlertaProcesandoPago();
        this.estadoPago = EstadoPagoPedido.PROCESANDO_PAGO;
      this.estadoChanged.emit(this.estadoPago);
      this.iniciarEfectosProcesamiento();
      this.cdr.detectChanges(); // Forzar detección de cambios

      const metodoEnum = this.convertirStringAMetodoPago(this.metodoSeleccionado);

      // 🚀 USAR SIMULACIÓN DE PAGO PARA MVP
      console.log(`🔄 Iniciando simulación de pago para pedido ${this.pedidoId} - Método: ${metodoEnum} - Monto: $${this.monto}`);

      // Usar el método de simulación en lugar de métodos específicos
      const resultado = await this.pagoService.simularPagoPedido(this.pedidoId, this.monto, metodoEnum).toPromise() as ResultadoPago;

      if (resultado.success) {
        await this.completarPagoExitoso(resultado);
      } else {
        await this.manejarPagoFallido(resultado.mensaje || 'Error en el procesamiento');
      }
    } catch (error) {
      console.error('Error procesando pago:', error);
      await this.manejarPagoFallido('Error de conexión. Intenta nuevamente.');
    }
  }

  // 🚨 NUEVA FUNCIÓN: Mostrar alerta de procesando pago
  private mostrarAlertaProcesandoPago() {
    // Usar alert nativo para máxima visibilidad
    setTimeout(() => {
      alert('🔄 PROCESANDO PAGO...\n\nSu pago está siendo procesado de forma segura.\nPor favor espere mientras validamos la transacción.');
    }, 100);
  }
  // 🚨 NUEVA FUNCIÓN: Mostrar alerta de pago exitoso con detalles
  private mostrarAlertaPagoExitosoDetallada(resultado: any, guardadoExitoso: boolean) {
    const transaccionId = resultado.codigoTransaccion || 'TXN-' + Date.now();
    const estado = guardadoExitoso ? 'GUARDADO EXITOSAMENTE' : 'GUARDADO CON PROBLEMAS';
    const icono = guardadoExitoso ? '✅' : '⚠️';

    setTimeout(() => {
      alert(`${icono} ¡PAGO PROCESADO EXITOSAMENTE!\n\n` +
            `💳 Método: ${this.metodoSeleccionado?.toUpperCase()}\n` +
            `💰 Monto: $${this.monto.toLocaleString()}\n` +
            `🔑 Transacción: ${transaccionId}\n` +
            `💾 Estado: ${estado}\n\n` +
            `🍽️ Su pedido ha sido enviado al restaurante y será preparado en breve.\n` +
            `📱 El mesero podrá ver y confirmar su pedido inmediatamente.\n\n` +
            `¡Gracias por su compra!`);
    }, 100);
  }

  // ⚡ NUEVA FUNCIÓN: Emitir evento global de pago completado
  private emitirEventoGlobalPagoCompletado(resultado: any) {
    try {
      const transaccionId = resultado.codigoTransaccion || 'TXN-' + Date.now();

      // Evento personalizado para componentes Angular
      const evento = new CustomEvent('pagoCompletadoInmediato', {
        detail: {
          pedidoId: this.pedidoId,
          estadoPago: EstadoPagoPedido.PAGO_REALIZADO,
          transaccionId: transaccionId,
          monto: this.monto,
          metodoPago: this.metodoSeleccionado,
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(evento);

      console.log('📡 ⚡ EVENTO GLOBAL INMEDIATO EMITIDO:', evento.detail);

      // También emitir el evento original como respaldo
      const eventoRespaldo = new CustomEvent('pagoCompletado', {
        detail: {
          pedidoId: this.pedidoId,
          estadoPago: EstadoPagoPedido.PAGO_REALIZADO,
          transaccionId: transaccionId
        }
      });
      window.dispatchEvent(eventoRespaldo);

    } catch (error) {
      console.error('❌ Error emitiendo evento global:', error);
    }
  }

  // 🔄 NUEVA FUNCIÓN: Forzar recarga de pedidos en gestión
  private forzarRecargaPedidosGestion() {
    try {
      // Emitir evento específico para recargar gestión de pedidos
      const eventoRecarga = new CustomEvent('forzarRecargaPedidos', {
        detail: {
          pedidoId: this.pedidoId,
          accion: 'PAGO_COMPLETADO',
          timestamp: new Date().toISOString()
        }
      });
      window.dispatchEvent(eventoRecarga);

      console.log('🔄 ⚡ EVENTO DE RECARGA FORZADA EMITIDO para pedido:', this.pedidoId);

      // También intentar recargar directamente si existe referencia al servicio
      if ((window as any).gestionPedidosComponent) {
        console.log('🔄 Intentando recarga directa del componente de gestión...');
        (window as any).gestionPedidosComponent.loadPedidos();
      }

    } catch (error) {
      console.error('❌ Error forzando recarga de pedidos:', error);
    }
  }

  // 🚨 NUEVA FUNCIÓN: Mostrar alerta de pago exitoso
  private mostrarAlertaPagoExitoso() {
    setTimeout(() => {
      alert('✅ ¡PAGO EXITOSO!\n\nSu pago ha sido procesado correctamente.\nEl pedido ha sido enviado a la cocina y será preparado en breve.\n\n¡Gracias por su compra!');
    }, 100);
  }

  private iniciarEfectosProcesamiento() {
    this.animacionActiva = true;
    this.porcentajeProcesamiento = 0;
    this.mensajeProcesamiento = 'iniciando';
    this.aplicarEfectoVisual();
    this.cdr.detectChanges(); // Forzar detección de cambios

    // Simular progreso
    this.intervaloProcesamiento = setInterval(() => {
      if (this.porcentajeProcesamiento < 95) {
        this.porcentajeProcesamiento += Math.random() * 3 + 1;
        this.actualizarMensajeProcesamiento();
        this.cdr.detectChanges();
      }
    }, 200);

    // Programar cambios de fase
    const fases = [
      { fase: 'validando', tiempo: 1000 },
      { fase: 'conectando', tiempo: 2000 },
      { fase: 'banco', tiempo: 3500 },
      { fase: 'autorizando', tiempo: 5000 }
    ];

    fases.forEach(({ fase, tiempo }) => {
      const timeout = setTimeout(() => {
        this.mensajeProcesamiento = fase as any;
        this.reproducirSonido('phase');
      }, tiempo);
      this.timeoutMensajes.push(timeout);
    });
  }

  private actualizarMensajeProcesamiento() {
    // Actualizar fase según el progreso
    if (this.porcentajeProcesamiento < 15) {
      this.mensajeProcesamiento = 'iniciando';
    } else if (this.porcentajeProcesamiento < 35) {
      this.mensajeProcesamiento = 'validando';
    } else if (this.porcentajeProcesamiento < 55) {
      this.mensajeProcesamiento = 'conectando';
    } else if (this.porcentajeProcesamiento < 75) {
      this.mensajeProcesamiento = 'banco';
    } else if (this.porcentajeProcesamiento < 95) {
      this.mensajeProcesamiento = 'autorizando';
    } else {
      this.mensajeProcesamiento = 'finalizando';
    }

    // Cambio dinámico de mensajes dentro de cada fase
    if (Math.random() < 0.3) { // 30% de probabilidad de cambiar mensaje
      const mensajes = this.mensajesFases[this.mensajeProcesamiento];
      const mensaje = mensajes[Math.floor(Math.random() * mensajes.length)];
      // Actualizar mensaje en el DOM
      const elemento = document.querySelector('.dynamic-message');
      if (elemento) {
        elemento.textContent = mensaje;
      }
    }
  }

  private aplicarEfectoVisual() {
    const container = document.querySelector('.pago-container');
    if (container) {
      container.classList.add('processing-glow');
    }
  }  private async completarPagoExitoso(resultado: any) {
    this.porcentajeProcesamiento = 100;
    this.mensajeProcesamiento = 'finalizando';
    this.cdr.detectChanges(); // Forzar detección de cambios

    // Efectos de éxito
    await this.reproducirEfectoExito();

    // 🔄 GUARDAR ESTADO PERSISTENTE DEL PAGO INMEDIATAMENTE
    console.log('💾 🚀 INICIANDO GUARDADO CRÍTICO DE PAGO...');
    const guardadoExitoso = await this.guardarEstadoPagoPersistente(resultado);

    // ⚡ FORZAR SINCRONIZACIÓN INMEDIATA DE ESTADO
    this.estadoPago = EstadoPagoPedido.PAGO_REALIZADO;
    this.estadoChanged.emit(this.estadoPago);
    this.pagoCompletado.emit(resultado);

    // 🚨 EMITIR EVENTO GLOBAL INMEDIATAMENTE
    this.emitirEventoGlobalPagoCompletado(resultado);

    // 🔄 FORZAR RECARGA DE PEDIDOS EN GESTIÓN
    this.forzarRecargaPedidosGestion();

    // 🚨 ALERTA DE PAGO EXITOSO CON INFORMACIÓN DETALLADA
    this.mostrarAlertaPagoExitosoDetallada(resultado, guardadoExitoso);

    // Finalizar efectos después de un breve delay
    setTimeout(() => {
      this.detenerEfectosProcesamiento();

      // 🔄 SEGUNDO GUARDADO COMO RESPALDO
      this.guardarEstadoPagoPersistente(resultado);

      this.cdr.detectChanges(); // Forzar detección de cambios
    }, 1000);
  }// 🔄 NUEVA FUNCIÓN: Guardar estado persistente del pago
  private async guardarEstadoPagoPersistente(resultado: any) {
    try {
      console.log('🔄 Iniciando guardado de estado persistente para pedido:', this.pedidoId);
      console.log('💰 Resultado del pago:', resultado);

      // 1. GUARDAR EN MÚLTIPLES UBICACIONES PARA MÁXIMA CONFIABILIDAD

      // Obtener pedidos existentes del localStorage
      const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
      console.log('📋 Pedidos existentes en localStorage:', pedidos);

      // Buscar y actualizar el pedido con el estado de pago
      const pedidoIndex = pedidos.findIndex((p: any) => p.id === this.pedidoId);
      console.log('🔍 Índice del pedido encontrado:', pedidoIndex);

      const transaccionId = resultado.codigoTransaccion || 'TXN-' + Date.now();
      const fechaPago = new Date().toISOString();

      // 2. ACTUALIZAR PEDIDO EXISTENTE SI SE ENCUENTRA
      if (pedidoIndex !== -1) {
        pedidos[pedidoIndex].estadoPago = 'PAGO_REALIZADO';
        pedidos[pedidoIndex].fechaPago = fechaPago;
        pedidos[pedidoIndex].transaccionId = transaccionId;
        pedidos[pedidoIndex].metodoPago = this.metodoSeleccionado;

        // Guardar de vuelta en localStorage
        localStorage.setItem('pedidos', JSON.stringify(pedidos));

        console.log('✅ Estado de pago guardado en pedido existente:', {
          pedidoId: this.pedidoId,
          estadoPago: 'PAGO_REALIZADO',
          transaccionId: transaccionId,
          pedidoActualizado: pedidos[pedidoIndex]
        });

        // También guardar en una lista separada para el mesero
        this.guardarNotificacionParaMesero(pedidos[pedidoIndex]);

      } else {
        console.warn('⚠️ No se encontró el pedido con ID:', this.pedidoId);
        console.log('📋 Pedidos disponibles:', pedidos.map((p: any) => ({ id: p.id, clienteNombre: p.clienteNombre })));

        // Como alternativa, crear un registro de pago directamente
        this.crearRegistroPagoDirecto(resultado);
      }

      // 3. GUARDAR EN REGISTRO SEPARADO DE ESTADOS DE PAGO (RESPALDO)
      const estadosPago = JSON.parse(localStorage.getItem('estados_pago_pedidos') || '{}');
      estadosPago[this.pedidoId] = {
        estadoPago: 'PAGO_REALIZADO',
        fechaPago: fechaPago,
        transaccionId: transaccionId,
        metodoPago: this.metodoSeleccionado,
        monto: this.monto
      };
      localStorage.setItem('estados_pago_pedidos', JSON.stringify(estadosPago));
      console.log('💾 Estado de pago guardado en registro separado');      // 4. GUARDAR EN SERVICIO DE PAGO
      this.pagoService.actualizarEstadoPagoPedido(this.pedidoId, EstadoPagoPedido.PAGO_REALIZADO);
      console.log('🔄 Estado actualizado en servicio de pago');

      // 5. FORZAR ACTUALIZACIÓN DEL ESTADO GLOBAL
      this.actualizarEstadoGlobal({
        id: this.pedidoId,
        estadoPago: 'PAGO_REALIZADO',
        transaccionId: transaccionId,
        metodoPago: this.metodoSeleccionado,
        monto: this.monto
      });

      // 6. VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
      await this.verificarGuardado();

      return true;

    } catch (error) {
      console.error('❌ Error al guardar estado persistente del pago:', error);

      // PLAN DE CONTINGENCIA: Guardar de forma alternativa
      try {
        this.guardarPagoDeEmergencia(resultado);
      } catch (emergencyError) {
        console.error('❌ Error en guardado de emergencia:', emergencyError);
      }

      return false;
    }
  }

  // 🆕 NUEVA FUNCIÓN: Verificar que el guardado fue exitoso
  private async verificarGuardado() {
    try {
      const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
      const pedidoGuardado = pedidos.find((p: any) => p.id === this.pedidoId);

      const estadosPago = JSON.parse(localStorage.getItem('estados_pago_pedidos') || '{}');
      const estadoGuardado = estadosPago[this.pedidoId];

      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
      const notificacionCreada = notificaciones.find((n: any) => n.pedidoId === this.pedidoId);

      console.log('🔍 Verificación de guardado:');
      console.log('- Pedido actualizado:', !!pedidoGuardado && pedidoGuardado.estadoPago === 'PAGO_REALIZADO');
      console.log('- Estado de pago guardado:', !!estadoGuardado);
      console.log('- Notificación creada:', !!notificacionCreada);

      if (pedidoGuardado?.estadoPago === 'PAGO_REALIZADO' || estadoGuardado) {
        console.log('✅ Guardado verificado exitosamente');
        return true;
      } else {
        console.warn('⚠️ El guardado no se completó correctamente');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando guardado:', error);
      return false;
    }
  }

  // 🚨 NUEVA FUNCIÓN: Guardado de emergencia
  private guardarPagoDeEmergencia(resultado: any) {
    console.log('🚨 Ejecutando guardado de emergencia...');

    const transaccionId = 'EMERGENCY-TXN-' + Date.now();
    const fechaPago = new Date().toISOString();

    // Crear un registro de emergencia
    const registroEmergencia = {
      timestamp: fechaPago,
      pedidoId: this.pedidoId,
      estadoPago: 'PAGO_REALIZADO',
      transaccionId: transaccionId,
      metodoPago: this.metodoSeleccionado,
      monto: this.monto,
      tipo: 'EMERGENCIA',
      resultado: resultado
    };

    // Guardar en múltiples claves para aumentar probabilidad de recuperación
    localStorage.setItem(`pago_emergencia_${this.pedidoId}`, JSON.stringify(registroEmergencia));
    localStorage.setItem(`emergency_payment_${Date.now()}`, JSON.stringify(registroEmergencia));

    // También en un array de pagos de emergencia
    const pagosEmergencia = JSON.parse(localStorage.getItem('pagos_emergencia') || '[]');
    pagosEmergencia.push(registroEmergencia);
    localStorage.setItem('pagos_emergencia', JSON.stringify(pagosEmergencia));

    console.log('🚨 Guardado de emergencia completado:', registroEmergencia);

    // Crear notificación de emergencia para el mesero
    this.crearNotificacionEmergencia(registroEmergencia);
  }

  // 🚨 NUEVA FUNCIÓN: Crear notificación de emergencia
  private crearNotificacionEmergencia(registro: any) {
    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');

      const notificacionEmergencia = {
        id: 'emergency-notif-' + Date.now(),
        tipo: 'PAGO_EMERGENCIA',
        pedidoId: registro.pedidoId,
        mesa: 'N/A',
        clienteNombre: 'Cliente',
        total: registro.monto,
        fechaNotificacion: registro.timestamp,
        leida: false,
        accionRequerida: 'VERIFICAR_PAGO',
        metodoPago: registro.metodoPago,
        transaccionId: registro.transaccionId,
        esEmergencia: true,
        mensaje: 'PAGO PROCESADO - VERIFICAR MANUALMENTE'
      };

      notificaciones.push(notificacionEmergencia);
      localStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));

      console.log('🚨 Notificación de emergencia creada:', notificacionEmergencia);
    } catch (error) {
      console.error('❌ Error creando notificación de emergencia:', error);
    }
  }

  // 🆕 NUEVA FUNCIÓN: Crear registro de pago directo si no se encuentra el pedido
  private crearRegistroPagoDirecto(resultado: any) {
    try {
      const registroPago = {
        id: this.pedidoId,
        estadoPago: 'PAGO_REALIZADO',
        fechaPago: new Date().toISOString(),
        transaccionId: resultado.codigoTransaccion || 'TXN-' + Date.now(),
        metodoPago: this.metodoSeleccionado,
        monto: this.monto,
        clienteId: localStorage.getItem('clienteId') || 'cliente-desconocido'
      };

      // Guardar en registro separado de pagos
      const registrosPago = JSON.parse(localStorage.getItem('registros_pago') || '[]');
      registrosPago.push(registroPago);
      localStorage.setItem('registros_pago', JSON.stringify(registrosPago));

      console.log('💾 Registro de pago directo creado:', registroPago);

      // Crear notificación para el mesero
      this.crearNotificacionMeseroDirecta(registroPago);

    } catch (error) {
      console.error('❌ Error al crear registro de pago directo:', error);
    }
  }

  // 🔔 NUEVA FUNCIÓN: Actualizar estado global para sincronización
  private actualizarEstadoGlobal(pedido: any) {
    try {
      // Emitir evento personalizado para que otros componentes sepan del cambio
      const evento = new CustomEvent('pagoCompletado', {
        detail: {
          pedidoId: pedido.id,
          estadoPago: pedido.estadoPago,
          transaccionId: pedido.transaccionId
        }
      });
      window.dispatchEvent(evento);

      console.log('📡 Evento global de pago completado emitido');
    } catch (error) {
      console.error('❌ Error al actualizar estado global:', error);
    }
  }
  // 🔔 NUEVA FUNCIÓN: Guardar notificación para el mesero
  private guardarNotificacionParaMesero(pedido: any) {
    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');

      const nuevaNotificacion = {
        id: 'notif-' + Date.now(),
        tipo: 'PAGO_COMPLETADO',
        pedidoId: pedido.id,
        mesa: pedido.mesa || 'N/A',
        clienteNombre: pedido.clienteNombre || 'Cliente',
        total: pedido.total || this.monto,
        fechaNotificacion: new Date().toISOString(),
        leida: false,
        accionRequerida: 'ACEPTAR_PEDIDO',
        metodoPago: pedido.metodoPago || this.metodoSeleccionado,
        transaccionId: pedido.transaccionId
      };

      notificaciones.push(nuevaNotificacion);
      localStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));

      console.log('🔔 Notificación para mesero creada:', nuevaNotificacion);
    } catch (error) {
      console.error('❌ Error al crear notificación para mesero:', error);
    }
  }

  // 🔔 NUEVA FUNCIÓN: Crear notificación directa para el mesero
  private crearNotificacionMeseroDirecta(registroPago: any) {
    try {
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');

      const nuevaNotificacion = {
        id: 'notif-' + Date.now(),
        tipo: 'PAGO_COMPLETADO',
        pedidoId: registroPago.id,
        mesa: 'Pendiente',
        clienteNombre: registroPago.clienteId,
        total: registroPago.monto,
        fechaNotificacion: new Date().toISOString(),
        leida: false,
        accionRequerida: 'ACEPTAR_PEDIDO',
        metodoPago: registroPago.metodoPago,
        transaccionId: registroPago.transaccionId
      };

      notificaciones.push(nuevaNotificacion);
      localStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));

      console.log('🔔 Notificación directa para mesero creada:', nuevaNotificacion);
    } catch (error) {
      console.error('❌ Error al crear notificación directa para mesero:', error);
    }
  }
  private async manejarPagoFallido(mensaje: string) {
    // Efectos de error
    await this.reproducirEfectoError();

    // 🚨 ALERTA DE PAGO FALLIDO
    this.mostrarAlertaPagoFallido(mensaje);

    this.estadoPago = EstadoPagoPedido.PAGO_FALLIDO;
    this.estadoChanged.emit(this.estadoPago);
    this.pagoFallido.emit({ mensaje });
    this.detenerEfectosProcesamiento();
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  // 🚨 NUEVA FUNCIÓN: Mostrar alerta de pago fallido
  private mostrarAlertaPagoFallido(mensaje: string) {
    setTimeout(() => {
      alert(`❌ ERROR EN EL PAGO\n\n${mensaje}\n\nPor favor verifique sus datos e intente nuevamente.\nSi el problema persiste, contacte con el personal del restaurante.`);
    }, 100);
  }

  private detenerEfectosProcesamiento() {
    this.animacionActiva = false;
    this.limpiarIntervalos();

    // Asegurar que llegue al 100%
    this.porcentajeProcesamiento = 100;
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  // ========================================
  // EFECTOS VISUALES Y AUDIO
  // ========================================

  private async reproducirEfectoExito() {
    this.reproducirSonido('success');
    this.crearExplosionParticulas();
    this.activarEfectoConfetti();
  }

  private async reproducirEfectoError() {
    this.reproducirSonido('error');
    this.activarEfectoVibracion();
  }

  private crearExplosionParticulas() {
    // Crear partículas de confetti para pagos exitosos
    for (let i = 0; i < 30; i++) {
      const particula = {
        x: this.canvasWidth / 2,
        y: this.canvasHeight / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -8 - 2,
        size: Math.random() * 6 + 2,
        alpha: 1,
        color: this.obtenerColorAleatorio(),
        life: 60,
        gravity: 0.2
      };
      this.particulas.push(particula);
    }
  }

  private activarEfectoConfetti() {
    // Activar animación de confetti de celebración
    if (this.ctx) {
      this.animacionActiva = true;
      setTimeout(() => {
        this.animacionActiva = false;
      }, 3000);
    }
  }

  private activarEfectoVibracion() {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }
    const container = document.querySelector('.pago-container');
    if (container) {
      container.classList.add('shake-error');
      setTimeout(() => {
        container.classList.remove('shake-error');
      }, 1000);
    }
  }

  private reproducirSonido(tipo: 'select' | 'processing' | 'success' | 'error' | 'phase') {
    if (!this.sonidosHabilitados || !this.audioContext) return;

    const oscilador = this.audioContext.createOscillator();
    const ganancia = this.audioContext.createGain();

    oscilador.connect(ganancia);
    ganancia.connect(this.audioContext.destination);

    const configuraciones = {
      select: { frecuencia: 800, duracion: 0.1, tipo: 'sine' },
      processing: { frecuencia: 400, duracion: 0.2, tipo: 'square' },
      success: { frecuencia: 600, duracion: 0.3, tipo: 'sine' },
      error: { frecuencia: 200, duracion: 0.5, tipo: 'sawtooth' },
      phase: { frecuencia: 500, duracion: 0.15, tipo: 'triangle' }
    };

    const config = configuraciones[tipo];
    oscilador.frequency.setValueAtTime(config.frecuencia, this.audioContext.currentTime);
    oscilador.type = config.tipo as OscillatorType;

    ganancia.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    ganancia.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + config.duracion);

    oscilador.start(this.audioContext.currentTime);
    oscilador.stop(this.audioContext.currentTime + config.duracion);
  }

  // ========================================
  // ANIMACIONES DE CANVAS
  // ========================================

  private iniciarAnimacionParticulas() {
    const animar = () => {
      if (this.ctx) {
        this.limpiarCanvas();
        this.actualizarParticulas();
        this.dibujarParticulas();
      }
      this.animationFrameId = requestAnimationFrame(animar);
    };
    animar();
  }

  private limpiarCanvas() {
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  }

  private actualizarParticulas() {
    this.particulas.forEach((particula, index) => {
      particula.x += particula.vx;
      particula.y += particula.vy;

      // Aplicar gravedad si existe
      if (particula.gravity) {
        particula.vy += particula.gravity;
      }

      particula.life--;

      // Efectos especiales durante procesamiento
      if (this.animacionActiva) {
        particula.vx *= 1.02; // Acelerar
        particula.alpha *= 0.98; // Desvanecer
      }

      // Rebotar en los bordes
      if (particula.x < 0 || particula.x > this.canvasWidth) {
        particula.vx *= -0.8;
      }
      if (particula.y < 0 || particula.y > this.canvasHeight) {
        particula.vy *= -0.8;
      }

      // Mantener partículas dentro del canvas
      particula.x = Math.max(0, Math.min(this.canvasWidth, particula.x));
      particula.y = Math.max(0, Math.min(this.canvasHeight, particula.y));

      // Eliminar partículas muertas o regenerar
      if (particula.life <= 0 || particula.alpha <= 0.01) {
        if (this.animacionActiva) {
          // Regenerar partícula
          Object.assign(particula, this.crearParticula());
        } else {
          // Eliminar partícula
          this.particulas.splice(index, 1);
        }
      }
    });
  }

  private dibujarParticulas() {
    if (!this.ctx) return;

    this.particulas.forEach(particula => {
      this.ctx!.save();
      this.ctx!.globalAlpha = particula.alpha;
      this.ctx!.fillStyle = particula.color;
      this.ctx!.beginPath();
      this.ctx!.arc(particula.x, particula.y, particula.size, 0, Math.PI * 2);
      this.ctx!.fill();
      this.ctx!.restore();
    });
  }

  // ========================================
  // VALIDACIÓN Y UTILIDADES
  // ========================================

  private validarDatos(): boolean {
    if (!this.metodoSeleccionado) return false;

    switch (this.metodoSeleccionado) {
      case 'tarjeta':
        return !!(this.datosPago.numeroTarjeta &&
                 this.datosPago.cvv &&
                 this.datosPago.fechaExpiracion &&
                 this.datosPago.nombreTitular);

      case 'nequi':
      case 'daviplata':
        return !!(this.datosPago.telefono && this.datosPago.telefono.length >= 10);

      case 'pse':
        return !!(this.datosPago.banco &&
                 this.datosPago.tipoDocumento &&
                 this.datosPago.numeroDocumento);

      case 'efectivo':
      default:
        return true;
    }
  }

  private mostrarError(mensaje: string) {
    // Mostrar mensaje de error con animación
    console.error('Error de pago:', mensaje);
    this.reproducirSonido('error');
  }

  private limpiarIntervalos() {
    if (this.intervaloProcesamiento) {
      clearInterval(this.intervaloProcesamiento);
      this.intervaloProcesamiento = null;
    }

    this.timeoutMensajes.forEach(timeout => clearTimeout(timeout));
    this.timeoutMensajes = [];
  }

  private limpiarAnimaciones() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  // ========================================
  // MÉTODOS PÚBLICOS PARA TEMPLATE
  // ========================================

  obtenerMensajeFaseActual(): string {
    const mensajes = this.mensajesFases[this.mensajeProcesamiento];
    return mensajes[0]; // Mensaje principal de la fase
  }

  obtenerIconoEstado(): string {
    switch (this.estadoPago) {
      case EstadoPagoPedido.PENDIENTE_PAGO: return '⏳';
      case EstadoPagoPedido.PROCESANDO_PAGO: return '🔄';
      case EstadoPagoPedido.PAGO_REALIZADO: return '✅';
      case EstadoPagoPedido.PAGO_FALLIDO: return '❌';
      default: return '💳';
    }
  }

  obtenerClaseEstado(): string {
    return `estado-${this.estadoPago}`;
  }

  toggleSonidos() {
    this.sonidosHabilitados = !this.sonidosHabilitados;
  }

  // Convertir string a enum MetodoPago
  private convertirStringAMetodoPago(metodo: string | null): MetodoPago {
    switch (metodo) {
      case 'efectivo':
        return MetodoPago.EFECTIVO;
      case 'tarjeta':
        return MetodoPago.TARJETA_CREDITO;
      case 'nequi':
        return MetodoPago.NEQUI;
      case 'pse':
        return MetodoPago.PSE;
      case 'daviplata':
        return MetodoPago.DAVIPLATA;
      default:
        return MetodoPago.EFECTIVO;
    }
  }
}
