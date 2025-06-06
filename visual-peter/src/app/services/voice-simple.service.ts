import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Interfaces para el nuevo sistema simplificado
export interface MensajeChat {
  texto: string;
  tipo: 'usuario' | 'asistente';
  fecha: Date;
}

export type EstadoVoz = 'idle' | 'escuchando' | 'procesando' | 'hablando';

export interface RespuestaIA {
  success: boolean;
  mensaje: string;
  accion?: string;
  datos?: any;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceSimpleService {
  private apiUrl = 'http://localhost:8080/api/cocina';

  // Reconocimiento de voz
  private recognition: any;
  private speechSynthesis = window.speechSynthesis;
  private vozSeleccionada: SpeechSynthesisVoice | null = null;

  // Estado del sistema
  private estadoActual = new BehaviorSubject<EstadoVoz>('idle');
  private mensajesChat = new BehaviorSubject<MensajeChat[]>([]);
  private escuchaActiva = false;

  // Configuración
  private readonly PALABRA_ACTIVACION = 'viernes';

  // Observables públicos
  public estado$ = this.estadoActual.asObservable();
  public mensajes$ = this.mensajesChat.asObservable();

  constructor(private http: HttpClient) {
    this.inicializarSistema();
  }

  // ========== INICIALIZACIÓN ==========

  private inicializarSistema(): void {
    console.log('🚀 Inicializando VoiceSimpleService...');

    if (!this.soporteVoz) {
      console.error('❌ Reconocimiento de voz no soportado');
      return;
    }

    this.configurarReconocimiento();
    this.configurarVoz();

    console.log('✅ VoiceSimpleService inicializado');
  }

  private configurarReconocimiento(): void {
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();

      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'es-ES';
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('🎤 Reconocimiento iniciado');
        this.actualizarEstado('escuchando');
      };      this.recognition.onresult = (event: any) => {
        this.procesarResultadoVoz(event);
      };

      this.recognition.onerror = (event: any) => {
        console.error('❌ Error en reconocimiento:', event.error);

        // No reiniciar automáticamente si ya está ejecutándose
        if (event.error === 'already-started') {
          console.log('🔄 Reconocimiento ya iniciado, continuando...');
          return;
        }

        this.actualizarEstado('idle');

        // Solo reiniciar para errores que no sean de estado
        if (event.error !== 'aborted' && event.error !== 'not-allowed') {
          this.reiniciarEscucha();
        }
      };

      this.recognition.onend = () => {
        console.log('🔇 Reconocimiento terminado');

        // Solo reiniciar si la escucha está activa y no hay errores
        if (this.escuchaActiva) {
          setTimeout(() => {
            this.reiniciarEscucha();
          }, 1000); // Esperar 1 segundo antes de reiniciar
        } else {
          this.actualizarEstado('idle');
        }
      };    } catch (error: any) {
      console.error('❌ Error configurando reconocimiento:', error);
    }
  }

  private configurarVoz(): void {
    if (this.speechSynthesis.getVoices().length === 0) {
      this.speechSynthesis.onvoiceschanged = () => {
        this.seleccionarVoz();
      };
    } else {
      this.seleccionarVoz();
    }
  }
  private seleccionarVoz(): void {
    const voces = this.speechSynthesis.getVoices();
    console.log('🎤 Voces disponibles:', voces.length);
    
    if (voces.length > 0) {
      console.log('🎤 Lista de voces:', voces.map(v => `${v.name} (${v.lang})`));
    }

    this.vozSeleccionada = voces.find((voz: any) =>
      voz.lang.includes('es') && voz.name.includes('Google')
    ) || voces.find((voz: any) => voz.lang.includes('es')) || voces[0];

    console.log('🔊 Voz seleccionada:', this.vozSeleccionada?.name || 'Predeterminada');
  }

  // ========== PROCESAMIENTO DE VOZ ==========

  private procesarResultadoVoz(event: any): void {
    const results = event.results;
    const ultimoResultado = results[results.length - 1];

    if (ultimoResultado.isFinal) {
      const comando = ultimoResultado[0].transcript.toLowerCase().trim();
      console.log('🎤 Comando detectado:', comando);

      if (this.esComandoValido(comando)) {
        const comandoLimpio = this.extraerComando(comando);
        this.procesarComandoConIA(comandoLimpio);
      }
    }
  }

  private esComandoValido(comando: string): boolean {
    return comando.includes(this.PALABRA_ACTIVACION.toLowerCase());
  }

  private extraerComando(comando: string): string {
    const palabraActivacion = this.PALABRA_ACTIVACION.toLowerCase();
    const indice = comando.indexOf(palabraActivacion);

    if (indice !== -1) {
      return comando.substring(indice + palabraActivacion.length).trim();
    }

    return comando;
  }

  // ========== PROCESAMIENTO DE COMANDOS ==========

  public async procesarComandoConIA(comando: string): Promise<void> {
    if (!comando || comando.length < 2) {
      console.warn('⚠️ Comando muy corto o vacío');
      return;
    }

    this.actualizarEstado('procesando');

    // Agregar mensaje del usuario
    const mensajeUsuario: MensajeChat = {
      texto: comando,
      tipo: 'usuario',
      fecha: new Date()
    };
    this.agregarMensaje(mensajeUsuario);    try {
      console.log('🤖 Enviando comando a IA:', comando);

      const respuesta = await firstValueFrom(this.http.post<RespuestaIA>(`${this.apiUrl}/comando-natural`, {
        comando: comando
      }));

      if (respuesta?.success && respuesta.mensaje) {
        // Agregar respuesta de la IA
        const mensajeRespuesta: MensajeChat = {
          texto: respuesta.mensaje,
          tipo: 'asistente',
          fecha: new Date()
        };
        this.agregarMensaje(mensajeRespuesta);

        // Hablar la respuesta
        await this.hablar(respuesta.mensaje);

        console.log('✅ Comando procesado exitosamente');
      } else {
        throw new Error('Respuesta inválida del servidor');
      }    } catch (error: any) {
      console.error('❌ Error procesando comando:', error);

      const mensajeError: MensajeChat = {
        texto: 'Lo siento, ocurrió un error al procesar tu solicitud.',
        tipo: 'asistente',
        fecha: new Date()
      };
      this.agregarMensaje(mensajeError);

      await this.hablar('Lo siento, ocurrió un error al procesar tu solicitud.');
    } finally {
      this.actualizarEstado('idle');
      setTimeout(() => {
        if (this.escuchaActiva) {
          this.actualizarEstado('escuchando');
        }
      }, 1000);
    }
  }

  // ========== SÍNTESIS DE VOZ ==========
  public async hablar(texto: string): Promise<void> {
    if (!texto || !window.speechSynthesis) {
      console.warn('⚠️ No se puede hablar: texto vacío o speechSynthesis no disponible');
      return;
    }

    console.log('🔊 Iniciando síntesis de voz:', texto);
    this.actualizarEstado('hablando');

    // Cancelar cualquier síntesis en curso
    this.speechSynthesis.cancel();

    return new Promise((resolve) => {
      // Pequeño delay para asegurar que la cancelación se procese
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(texto);

        if (this.vozSeleccionada) {
          utterance.voice = this.vozSeleccionada;
          console.log('🎤 Usando voz:', this.vozSeleccionada.name);
        } else {
          console.log('🎤 Usando voz predeterminada');
        }

        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        utterance.onstart = () => {
          console.log('🔊 Síntesis iniciada');
        };

        utterance.onend = () => {
          console.log('🔊 Síntesis completada');
          resolve();
        };

        utterance.onerror = (error) => {
          console.error('❌ Error en síntesis:', error);
          resolve();
        };

        console.log('🎵 Enviando texto a speechSynthesis.speak()');
        this.speechSynthesis.speak(utterance);
      }, 100);
    });
  }

  // ========== CONTROL DE ESCUCHA ==========

  public iniciarEscuchaContinua(): boolean {
    if (!this.soporteVoz || this.escuchaActiva) {
      return false;
    }

    try {
      this.escuchaActiva = true;
      this.recognition.start();
      console.log('🎤 Escucha continua iniciada');      return true;
    } catch (error: any) {
      console.error('❌ Error iniciando escucha:', error);
      this.escuchaActiva = false;
      return false;
    }
  }

  public detenerEscuchaContinua(): void {
    if (!this.escuchaActiva) {
      return;
    }

    this.escuchaActiva = false;

    try {      this.recognition.stop();
      console.log('🔇 Escucha continua detenida');
    } catch (error: any) {
      console.error('❌ Error deteniendo escucha:', error);
    }

    this.actualizarEstado('idle');
  }
  private reiniciarEscucha(): void {
    if (!this.escuchaActiva) {
      return;
    }

    // Verificar el estado actual del reconocimiento antes de reiniciar
    try {
      if (this.recognition && this.recognition.readyState === 'running') {        console.log('🔄 Reconocimiento ya en ejecución, evitando reinicio');
        return;
      }
    } catch (error: any) {
      // Continuar con el reinicio si no se puede verificar el estado
    }

    setTimeout(() => {
      try {
        if (this.escuchaActiva && this.recognition) {
          console.log('🔄 Reiniciando reconocimiento de voz');
          this.recognition.start();
        }      } catch (error: any) {
        console.warn('⚠️ Error reiniciando escucha:', error);

        // Solo reintentar si no es un error de "already started"
        if (error?.message && !error.message.includes('already started')) {
          setTimeout(() => this.reiniciarEscucha(), 2000);
        } else {
          console.log('⚠️ Reconocimiento ya iniciado, cancelando reintento');
        }
      }
    }, 500);
  }

  // ========== MÉTODOS PÚBLICOS ADICIONALES ==========
  public limpiarConversacion(): void {
    this.mensajesChat.next([]);
    console.log('🧹 Conversación limpiada');
  }

  public async probarSintesisVoz(): Promise<void> {
    console.log('🧪 Probando síntesis de voz...');
    await this.hablar('Hola, esta es una prueba de síntesis de voz.');
  }

  public verificarEstadoSintesis(): any {
    const estado = {
      speechSynthesisDisponible: !!window.speechSynthesis,
      speaking: window.speechSynthesis?.speaking || false,
      pending: window.speechSynthesis?.pending || false,
      paused: window.speechSynthesis?.paused || false,
      vocesDisponibles: window.speechSynthesis?.getVoices().length || 0,
      vozSeleccionada: this.vozSeleccionada?.name || 'Ninguna'
    };
    
    console.log('🔍 Estado de síntesis de voz:', estado);
    return estado;
  }

  public get escuchaContinuaEstaActiva(): boolean {
    return this.escuchaActiva;
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  private actualizarEstado(estado: EstadoVoz) {
    this.estadoActual.next(estado);
  }

  private agregarMensaje(mensaje: MensajeChat) {
    const mensajes = [...this.mensajesChat.value, mensaje];
    this.mensajesChat.next(mensajes);
  }

  // ========== GETTERS ==========

  public get soporteVoz(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  public get estadoVoz(): EstadoVoz {
    return this.estadoActual.value;
  }

  public get estaEscuchando(): boolean {
    return this.escuchaActiva && this.estadoActual.value === 'escuchando';
  }

  public get estaHablando(): boolean {
    return this.estadoActual.value === 'hablando';
  }

  public get mensajes(): MensajeChat[] {
    return this.mensajesChat.value;
  }
}
