import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VoiceSimpleService, MensajeChat, EstadoVoz } from '../../services/voice-simple.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ia-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ia-asistente.component.html',
  styleUrls: ['./ia-asistente.component.scss']
})
export class IAAsistenteComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('inputTexto') inputTexto!: ElementRef;

  mensajes: MensajeChat[] = [];
  estadoVoz: EstadoVoz = 'idle';
  mensajeTexto: string = '';
  // Estados de la interfaz
  panelExpandido = false; // Inicia minimizado
  mostrarIndicadorEscucha = false;

  // Subscripciones
  private subscripciones: Subscription[] = [];
  private scrollTimeout: any;

  constructor(public voiceService: VoiceSimpleService) {}

  ngOnInit() {
    this.inicializarSubscripciones();
    this.iniciarEscuchaContinua();
  }

  ngOnDestroy() {
    this.subscripciones.forEach(sub => sub.unsubscribe());
    this.voiceService.detenerEscuchaContinua();
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  private inicializarSubscripciones() {
    // Suscribirse a mensajes
    const subMensajes = this.voiceService.mensajes$.subscribe(mensajes => {
      this.mensajes = mensajes;
    });

    // Suscribirse al estado de voz
    const subEstado = this.voiceService.estado$.subscribe(estado => {
      this.estadoVoz = estado;
      this.mostrarIndicadorEscucha = estado === 'escuchando';
    });

    this.subscripciones.push(subMensajes, subEstado);
  }

  private iniciarEscuchaContinua() {
    setTimeout(() => {
      const resultado = this.voiceService.iniciarEscuchaContinua();
      if (resultado) {
        console.log('🎤 IA Asistente: Escucha continua activada');
      } else {
        console.warn('⚠️ IA Asistente: No se pudo activar escucha continua');
      }
    }, 500);
  }

  // Enviar mensaje por texto
  async enviarMensajeTexto() {
    if (!this.mensajeTexto.trim()) return;

    const mensaje = this.mensajeTexto.trim();
    this.mensajeTexto = '';

    try {
      await this.voiceService.procesarComandoConIA(mensaje);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    }
  }

  // Alternar panel expandido/colapsado
  togglePanel() {
    this.panelExpandido = !this.panelExpandido;
  }

  // Limpiar conversación
  limpiarConversacion() {
    this.voiceService.limpiarConversacion();
  }

  // Activar/desactivar escucha continua
  toggleEscuchaContinua() {
    if (this.voiceService.escuchaContinuaEstaActiva) {
      this.voiceService.detenerEscuchaContinua();
    } else {
      this.voiceService.iniciarEscuchaContinua();
    }
  }

  // Scroll automático al final
  private scrollToBottom() {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      try {
        if (this.chatContainer) {
          const container = this.chatContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      } catch (error) {
        // Silenciar errores de scroll
      }
    }, 100);
  }

  // Getters para el template
  get estadoTexto(): string {
    switch (this.estadoVoz) {
      case 'escuchando': return 'Escuchando...';
      case 'procesando': return 'Procesando...';
      case 'hablando': return 'Hablando...';
      default: return 'Listo';
    }
  }

  get iconoEstado(): string {
    switch (this.estadoVoz) {
      case 'escuchando': return '🎤';
      case 'procesando': return '🤖';
      case 'hablando': return '🔊';
      default: return '💤';
    }
  }

  get claseEstado(): string {
    return `estado-${this.estadoVoz}`;
  }

  // Manejar Enter en input
  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviarMensajeTexto();
    }
  }
  // Formatear timestamp para mostrar
  formatearTiempo(fecha: Date): string {
    return fecha.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // TrackBy function para optimizar ngFor
  trackByMensaje(index: number, mensaje: MensajeChat): string {
    return `${mensaje.fecha.getTime()}-${mensaje.tipo}-${index}`;
  }
}
