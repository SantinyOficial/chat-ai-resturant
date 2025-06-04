import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CocinaService, PedidoCocina, EstadoCocina, PrioridadPedido, EstadisticasCocina, CocineroAsignado } from '../../services/cocina.service';
import { VoiceService, ComandoVoz, RespuestaAI, RespuestaComando } from '../../services/voice.service';

// Interfaz extendida para el componente que incluye propiedades temporales
interface PedidoCocinaExtendido extends PedidoCocina {
  cocineroTemporal?: string;
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [VoiceService],
  templateUrl: './cocina.component.html',
  styleUrls: ['./cocina.component.scss']
})
export class CocinaComponent implements OnInit, OnDestroy {
  activeTab: string = 'pendientes';

  // Estados de carga
  loadingPendientes: boolean = true;
  loadingPreparacion: boolean = false;
  loadingListos: boolean = false;
  loadingCocineros: boolean = false;
  procesandoPedido: string | null = null;
    // Datos
  pedidosPendientes: PedidoCocinaExtendido[] = [];
  pedidosEnPreparacion: PedidoCocinaExtendido[] = [];
  pedidosListos: PedidoCocinaExtendido[] = [];
  cocinerosDisponibles: CocineroAsignado[] = [];
  estadisticas: EstadisticasCocina | null = null;
  // Actualización automática
  private refreshInterval: any;  // Propiedades para voz con IA
  escuchandoVoz: boolean = false;
  ultimoComando: string = '';
  comandoManual: string = '';
  private comandosSubscription: any;

  // Estados de Viernes AI mejorados
  estadoVozViernes: 'idle' | 'listening' | 'processing' | 'speaking' = 'idle';
  estaHablandoViernes: boolean = false;

  // Estado de IA (Groq LLM)
  ultimaRespuestaAI: RespuestaAI | null = null;
  procesandoComandoIA: boolean = false;

  constructor(
    private cocinaService: CocinaService,
    private voiceService: VoiceService
  ) {}
  // Getter para soporte de voz
  get soporteVoz(): boolean {
    return this.voiceService.soporteVoz;
  }

  // Getter para estado de escucha continua
  get viernesActivo(): boolean {
    return this.voiceService.escuchaContinuaEstaActiva;
  }
  // Getter para mostrar estado completo de Viernes
  get estadoViernes(): string {
    if (!this.soporteVoz) return 'No disponible';

    switch (this.estadoVozViernes) {
      case 'listening':
        return 'Escuchando...';
      case 'processing':
        return 'Procesando comando';
      case 'speaking':
        return 'Respondiendo';
      case 'idle':
        return this.viernesActivo ? 'Listo para escuchar' : 'Inactivo';
      default:
        return 'Inactivo';
    }
  }

  // Getter para saber si Viernes está activo visualmente
  get viernesIndicadorActivo(): boolean {
    return this.viernesActivo && this.estadoVozViernes !== 'idle';
  }

  // Getter para clases CSS dinámicas
  get viernesClasesCSS(): string {
    const clases = ['viernes-status'];

    if (this.viernesActivo) clases.push('active');
    if (this.estadoVozViernes === 'processing') clases.push('processing');
    if (this.estadoVozViernes === 'speaking') clases.push('speaking');
    if (this.estadoVozViernes === 'listening') clases.push('listening');

    return clases.join(' ');
  }
  ngOnInit() {
    this.loadEstadisticas();
    this.loadPedidosPendientes();
    this.loadCocineros();

    // Suscribirse a comandos de voz
    this.comandosSubscription = this.voiceService.comandosDetectados$.subscribe(
      (comando: ComandoVoz) => this.procesarComandoVoz(comando)
    );    // Suscribirse al estado de escucha
    this.voiceService.estaEscuchando$.subscribe(
      (escuchando: boolean) => this.escuchandoVoz = escuchando
    );

    // Suscribirse al estado de voz de Viernes
    this.voiceService.estadoVoz$.subscribe(
      (estado: 'idle' | 'listening' | 'processing' | 'speaking') => {
        this.estadoVozViernes = estado;
      }
    );

    // Suscribirse al estado de habla
    this.voiceService.estaHablando$.subscribe(
      (hablando: boolean) => this.estaHablandoViernes = hablando
    );

    // Suscribirse a detección de palabra de activación
    this.voiceService.palabraActivacionDetectada$.subscribe(
      (texto: string) => {
        console.log('🔔 Palabra "Viernes" detectada:', texto);
        // Efectos visuales se manejan por estadoVozViernes
      }
    );

    // Actualizar cada 30 segundos
    this.refreshInterval = setInterval(() => {
      this.refreshCurrentTab();
      this.loadEstadisticas();
    }, 30000);    // ⭐ INICIAR ESCUCHA CONTINUA AUTOMÁTICAMENTE ⭐
    setTimeout(async () => {
      if (this.voiceService.soporteVoz) {
        // Primero solicitar permisos
        const permisosOtorgados = await this.voiceService.solicitarPermisos();

        if (permisosOtorgados) {
          const exito = this.voiceService.iniciarEscuchaContinua();
          if (exito) {
            console.log('🎤 Viernes activado automáticamente en módulo de cocina');
          } else {
            console.warn('⚠️ No se pudo activar Viernes automáticamente');
          }
        } else {
          console.warn('⚠️ Permisos de voz no otorgados, Viernes no se puede activar');
        }
      } else {
        console.warn('⚠️ Reconocimiento de voz no soportado en este navegador');
      }
    }, 2000); // Esperar 2 segundos para que se cargue todo
  }  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.comandosSubscription) {
      this.comandosSubscription.unsubscribe();
    }

    // ⭐ DETENER ESCUCHA CONTINUA AL SALIR DEL MÓDULO ⭐
    this.voiceService.detenerEscuchaContinua();
    console.log('🎤 Viernes desactivado al salir del módulo de cocina');
  }

  refreshCurrentTab() {
    switch (this.activeTab) {
      case 'pendientes':
        this.loadPedidosPendientes();
        break;
      case 'preparacion':
        this.loadPedidosEnPreparacion();
        break;
      case 'listos':
        this.loadPedidosListos();
        break;
      case 'cocineros':
        this.loadCocineros();
        break;
    }
  }

  cambiarTab(tab: string) {
    this.activeTab = tab;
    this.refreshCurrentTab();
  }

  loadEstadisticas() {
    this.cocinaService.getEstadisticas().subscribe({
      next: (estadisticas) => {
        this.estadisticas = estadisticas;
      },
      error: (err) => {
        console.error('Error al cargar estadísticas:', err);
      }
    });
  }

  loadPedidosPendientes() {
    this.loadingPendientes = true;
    this.cocinaService.getPedidosPendientes().subscribe({
      next: (pedidos) => {
        this.pedidosPendientes = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        })).sort((a, b) => {
          // Ordenar por prioridad y luego por fecha
          const prioridadOrder = { 'URGENTE': 3, 'ALTA': 2, 'NORMAL': 1 };
          const aPrioridad = prioridadOrder[a.prioridad as keyof typeof prioridadOrder] || 1;
          const bPrioridad = prioridadOrder[b.prioridad as keyof typeof prioridadOrder] || 1;

          if (aPrioridad !== bPrioridad) {
            return bPrioridad - aPrioridad;
          }

          return new Date(a.fechaRecibido).getTime() - new Date(b.fechaRecibido).getTime();
        });
        this.loadingPendientes = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos pendientes:', err);
        this.loadingPendientes = false;
      }
    });
  }

  loadPedidosEnPreparacion() {
    this.loadingPreparacion = true;
    this.cocinaService.getPedidosEnPreparacion().subscribe({
      next: (pedidos) => {
        this.pedidosEnPreparacion = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        }));
        this.loadingPreparacion = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos en preparación:', err);
        this.loadingPreparacion = false;
      }
    });
  }

  loadPedidosListos() {
    this.loadingListos = true;
    this.cocinaService.getPedidosListos().subscribe({
      next: (pedidos) => {
        this.pedidosListos = pedidos.map(pedido => ({
          ...pedido,
          cocineroTemporal: ''
        }));
        this.loadingListos = false;
      },
      error: (err) => {
        console.error('Error al cargar pedidos listos:', err);
        this.loadingListos = false;
      }
    });
  }

  loadCocineros() {
    this.loadingCocineros = true;
    this.cocinaService.getCocinerosDisponibles().subscribe({
      next: (cocineros) => {
        this.cocinerosDisponibles = cocineros;
        this.loadingCocineros = false;
      },
      error: (err) => {
        console.error('Error al cargar cocineros:', err);
        this.loadingCocineros = false;
      }
    });
  }
  iniciarPreparacion(pedido: PedidoCocina) {
    this.procesandoPedido = pedido.id;
    const cocineroId = (pedido as any).cocineroTemporal;    this.cocinaService.iniciarPreparacion(pedido.id, cocineroId).subscribe({
      next: (pedidoActualizado) => {
        console.log('Preparación iniciada:', pedidoActualizado);
        // ⚠️ NO HABLAR AQUÍ - solo la IA debe hablar para evitar duplicación
        this.procesandoPedido = null;
        this.loadPedidosPendientes();
        this.loadPedidosEnPreparacion();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al iniciar preparación:', err);
        // ⚠️ NO HABLAR AQUÍ - solo la IA debe hablar para evitar duplicación
        this.procesandoPedido = null;
        alert('Error al iniciar la preparación del pedido.');
      }
    });
  }

  cambiarPrioridad(pedido: PedidoCocina) {
    const prioridades = ['NORMAL', 'ALTA', 'URGENTE'];
    const currentIndex = prioridades.indexOf(pedido.prioridad);
    const newIndex = (currentIndex + 1) % prioridades.length;
    const newPrioridad = prioridades[newIndex] as PrioridadPedido;

    this.cocinaService.cambiarPrioridad(pedido.id, newPrioridad).subscribe({
      next: (pedidoActualizado) => {
        console.log('Prioridad cambiada:', pedidoActualizado);
        this.loadPedidosPendientes();
      },
      error: (err) => {
        console.error('Error al cambiar prioridad:', err);
        alert('Error al cambiar la prioridad del pedido.');
      }
    });
  }

  actualizarEstadoItem(pedidoId: string, itemNombre: string, estado: EstadoCocina) {
    this.cocinaService.actualizarEstadoItem(pedidoId, itemNombre, estado).subscribe({
      next: (pedidoActualizado) => {
        console.log('Estado del ítem actualizado:', pedidoActualizado);
        this.loadPedidosEnPreparacion();
      },
      error: (err) => {
        console.error('Error al actualizar estado del ítem:', err);
      }
    });
  }

  pausarPedido(pedido: PedidoCocina) {
    const motivo = prompt('Motivo de la pausa (opcional):');

    this.cocinaService.pausarPedido(pedido.id, motivo || undefined).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido pausado:', pedidoActualizado);
        this.loadPedidosEnPreparacion();
      },
      error: (err) => {
        console.error('Error al pausar pedido:', err);
        alert('Error al pausar el pedido.');
      }
    });  }
  marcarPedidoListo(pedido: PedidoCocina) {
    this.cocinaService.marcarPedidoListo(pedido.id).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido marcado como listo:', pedidoActualizado);
        // ⚠️ NO HABLAR AQUÍ - solo la IA debe hablar para evitar duplicación
        this.loadPedidosEnPreparacion();
        this.loadPedidosListos();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al marcar pedido como listo:', err);
        // ⚠️ NO HABLAR AQUÍ - solo la IA debe hablar para evitar duplicación
        alert('Error al marcar el pedido como listo.');
      }
    });
  }

  notificarPedidoListo(pedido: PedidoCocina) {
    this.cocinaService.notificarPedidoListo(pedido.id).subscribe({
      next: (resultado) => {
        console.log('Notificación enviada:', resultado);
        alert('Notificación enviada al cliente y mesero.');
      },
      error: (err) => {
        console.error('Error al enviar notificación:', err);
        alert('Error al enviar la notificación.');
      }
    });
  }

  marcarPedidoEntregado(pedido: PedidoCocina) {
    this.cocinaService.marcarPedidoEntregado(pedido.id).subscribe({
      next: (pedidoActualizado) => {
        console.log('Pedido entregado:', pedidoActualizado);
        this.loadPedidosListos();
        this.loadEstadisticas();
      },
      error: (err) => {
        console.error('Error al marcar pedido como entregado:', err);
        alert('Error al marcar el pedido como entregado.');
      }
    });
  }

  verPedidosCocinero(cocinero: CocineroAsignado) {
    this.cocinaService.getPedidosPorCocinero(cocinero.id).subscribe({
      next: (pedidos) => {
        console.log(`Pedidos de ${cocinero.nombre}:`, pedidos);
        // Aquí podrías abrir un modal o navegar a una vista detallada
        alert(`${cocinero.nombre} tiene ${pedidos.length} pedidos asignados.`);
      },
      error: (err) => {
        console.error('Error al cargar pedidos del cocinero:', err);
      }
    });
  }

  calcularProgreso(pedido: PedidoCocina): number {
    if (!pedido.items || pedido.items.length === 0) return 0;

    const itemsListos = pedido.items.filter(item => item.estado === EstadoCocina.LISTO).length;
    return Math.round((itemsListos / pedido.items.length) * 100);
  }

  calcularTiempoTranscurrido(fecha?: string): string {
    if (!fecha) return 'Desconocido';

    const now = new Date().getTime();
    const inicio = new Date(fecha).getTime();
    const diferencia = now - inicio;

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(minutos / 60);

    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    }
    return `${minutos}m`;
  }

  getPrioridadTexto(prioridad: PrioridadPedido): string {
    const textos = {
      'NORMAL': 'Normal',
      'ALTA': 'Alta',
      'URGENTE': 'Urgente'
    };
    return textos[prioridad] || prioridad;
  }
  getEstadoTexto(estado: EstadoCocina): string {
    const textos = {
      'RECIBIDO': 'Recibido',
      'EN_PREPARACION': 'En Preparación',
      'LISTO': 'Listo',
      'ENTREGADO': 'Entregado',
      'PAUSADO': 'Pausado',
      'CANCELADO': 'Cancelado'
    };
    return textos[estado] || estado;
  }
  // === MÉTODOS DE VOZ MEJORADOS ===

  /**
   * Método legacy - ahora solo para mostrar estado
   */
  toggleReconocimientoVoz() {
    if (this.voiceService.escuchaContinuaEstaActiva) {
      this.voiceService.detenerEscuchaContinua();
    } else {
      this.voiceService.iniciarEscuchaContinua();
    }
  }

  /**
   * Método mejorado para controlar Viernes
   */
  toggleEscuchaVoz() {
    if (this.voiceService.escuchaContinuaEstaActiva) {
      this.voiceService.detenerEscuchaContinua();
    } else {
      const exito = this.voiceService.iniciarEscuchaContinua();
      if (!exito) {
        alert('No se pudo activar Viernes. Verifique los permisos del micrófono.');
      }
    }
  }
  // Procesar comando de voz detectado con IA REAL
  private async procesarComandoVoz(comando: ComandoVoz) {
    this.ultimoComando = comando.texto;
    console.log('🎤 Comando detectado:', comando);

    // Solo procesar si tiene confianza mínima
    if (comando.confianza < 0.6) {
      // ⚠️ NO HABLAR AQUÍ - el VoiceService ya maneja errores
      console.log('⚠️ Comando con baja confianza ignorado:', comando.confianza);
      return;
    }

    this.procesandoComandoIA = true;

    try {
      // 🤖 SIEMPRE USAR IA REAL (ya no hay modo tradicional)
      await this.procesarComandoConIA(comando);
    } catch (error) {
      console.error('Error en procesamiento:', error);
      // ⚠️ NO HABLAR AQUÍ - el VoiceService ya maneja errores de IA
    } finally {
      this.procesandoComandoIA = false;
    }
  }
  // Procesamiento con IA REAL (Groq LLM)
  private async procesarComandoConIA(comando: ComandoVoz) {
    try {
      const respuesta = await this.voiceService.procesarComandoDetectado(comando);
      this.ultimaRespuestaAI = respuesta;

      if (respuesta.success) {
        console.log('✅ IA Groq procesó el comando:', {
          accion: respuesta.accion,
          mesa: respuesta.mesa,
          confianza: respuesta.confianza,
          respuestaIA: respuesta.respuestaAI
        });

        // 🔄 Actualizar interfaz basado en la acción ejecutada
        this.actualizarDatosDespuesAccionIA(respuesta);
      } else {
        console.log('❌ Error en IA Groq:', respuesta.mensaje);
        // ⚠️ NO HABLAR AQUÍ - el VoiceService ya habló con el mensaje de error
      }
    } catch (error) {
      console.error('Error en procesamiento IA:', error);
      // ⚠️ NO HABLAR AQUÍ - el VoiceService ya maneja errores de conexión
    }
  }
  // ========== MÉTODOS DE ACTUALIZACIÓN DE UI ==========

  // Actualizar datos después de acción IA exitosa
  private actualizarDatosDespuesAccionIA(respuesta: RespuestaAI) {
    // Actualizar basado en la acción ejecutada por la IA Groq
    switch (respuesta.accion) {
      case 'COMPLETAR_PEDIDO':
      case 'MARCAR_LISTO':
        this.loadPedidosEnPreparacion();
        this.loadPedidosListos();
        break;

      case 'INICIAR_PEDIDO':
      case 'EMPEZAR_PREPARACION':
        this.loadPedidosPendientes();
        this.loadPedidosEnPreparacion();
        break;

      case 'CANCELAR_PEDIDO':
        this.loadPedidosPendientes();
        this.loadPedidosEnPreparacion();
        this.loadPedidosListos();
        break;

      case 'PAUSAR_PEDIDO':
      case 'REANUDAR_PEDIDO':
        this.loadPedidosEnPreparacion();
        break;

      case 'CONSULTAR_ESTADO':
      case 'CONSULTAR_MESA':
        // Para consultas, solo actualizar datos sin cambiar estado
        this.refreshCurrentTab();
        break;

      case 'CONVERSACION':
        // Para conversación general, no hacer nada especial
        break;

      default:
        // Para acciones desconocidas, actualizar todo por seguridad
        this.refreshCurrentTab();
        break;
    }

    // Siempre actualizar estadísticas después de cualquier acción
    this.loadEstadisticas();

    // Log para debugging
    console.log(`🔄 UI actualizada después de acción: ${respuesta.accion} para mesa ${respuesta.mesa}`);
  }

  // ========== MÉTODOS DE TESTING Y UTILIDADES ==========

  // Comando manual de voz (para testing)
  enviarComandoManual() {
    if (this.comandoManual.trim()) {
      this.procesarComandoVoz({
        texto: this.comandoManual.toLowerCase().trim(),
        confianza: 1.0,
        timestamp: new Date()
      });
      this.comandoManual = '';
    }
  }
  // Obtener información de la última respuesta AI
  get infoUltimaRespuestaAI(): string {
    if (!this.ultimaRespuestaAI) return '';

    return `Acción: ${this.ultimaRespuestaAI.accion}, Mesa: ${this.ultimaRespuestaAI.mesa}, Confianza: ${(this.ultimaRespuestaAI.confianza || 0) * 100}%`;
  }

  // Obtener estado de la conversación con IA (mejorado)
  get estadoConversacionIA(): string {
    if (this.procesandoComandoIA) return 'Procesando...';
    if (!this.soporteVoz) return 'Voz no disponible';
    if (this.viernesActivo) return 'Viernes escuchando';
    return 'Viernes inactivo';
  }

  // Obtener instrucciones para el usuario
  get instruccionesViernes(): string {
    if (!this.soporteVoz) return 'Reconocimiento de voz no disponible en este navegador';
    if (this.viernesActivo) return 'Dí "Viernes" seguido de tu comando (ej: "Viernes, mesa 5 lista")';
    return 'Viernes está desactivado. Usa el botón para activarlo.';
  }
}
