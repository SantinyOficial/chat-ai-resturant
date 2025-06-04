import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

// Interfaces necesarias
export interface ComandoVoz {
  texto: string;
  confianza: number;
  timestamp: Date;
}

export interface RespuestaAI {
  success: boolean;
  mensaje: string;
  accion?: string;
  mesa?: number;
  confianza?: number;
  respuestaAI?: string;
  comandoOriginal?: string;
}

export interface RespuestaComando {
  success: boolean;
  mensaje: string;
  pedido?: any;
  comandoOriginal?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private apiUrl = 'http://localhost:8080/api/cocina';
  private recognition: any;
  private speechSynthesis = window.speechSynthesis;
  private voces: SpeechSynthesisVoice[] = [];
  private vozSeleccionada: SpeechSynthesisVoice | null = null;

  // Sistema de escucha continua y activación por palabra clave
  private escuchaContinuaActiva = false;
  private palabraActivacion = 'viernes';
  private timeoutReconocimiento: any;
  private intentosReconexion = 0;
  private maxIntentos = 3;
  // Control de síntesis de voz para evitar interrupciones
  private sintesisEnCurso = false;
  private colaSintesis: string[] = [];
  private timeoutSintesis: any;

  // Sistema de deduplicación de comandos
  private historialComandos: Array<{comando: string, timestamp: number}> = [];
  private TIEMPO_DEDUPLICACION = 3000; // 3 segundos
  private UMBRAL_SIMILITUD = 0.8; // 80% similitud para considerar duplicado

  // Subjects para comunicación
  private comandosDetectados = new Subject<ComandoVoz>();
  private estaEscuchando = new BehaviorSubject<boolean>(false);
  private palabraActivacionDetectada = new Subject<string>();
  private estaHablando = new BehaviorSubject<boolean>(false);
  private estadoVoz = new BehaviorSubject<'idle' | 'listening' | 'processing' | 'speaking'>('idle');

  // Observables públicos
  comandosDetectados$ = this.comandosDetectados.asObservable();
  estaEscuchando$ = this.estaEscuchando.asObservable();
  palabraActivacionDetectada$ = this.palabraActivacionDetectada.asObservable();
  estaHablando$ = this.estaHablando.asObservable();
  estadoVoz$ = this.estadoVoz.asObservable();

  constructor(private http: HttpClient) {
    this.inicializarReconocimiento();
    this.inicializarVoces();
  }

  // Getter para verificar soporte de voz
  get soporteVoz(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }
  private inicializarReconocimiento() {
    if (!this.soporteVoz) {
      console.warn('Reconocimiento de voz no soportado en este navegador');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();

    // Configuración para escucha continua estilo Alexa
    this.recognition.continuous = true;  // Escucha continua
    this.recognition.interimResults = true;  // Resultados temporales
    this.recognition.lang = 'es-ES';
    this.recognition.maxAlternatives = 1;    this.recognition.onstart = () => {
      console.log('🎤 Viernes está escuchando...');
      this.estaEscuchando.next(true);
      this.estadoVoz.next('listening');
      this.intentosReconexion = 0;
    };    this.recognition.onend = () => {
      console.log('🎤 Reconocimiento terminado');
      this.estaEscuchando.next(false);
      this.estadoVoz.next('idle');

      // Auto-reiniciar si la escucha continua está activa
      if (this.escuchaContinuaActiva && this.intentosReconexion < this.maxIntentos) {
        console.log('🔄 Reiniciando escucha continua...');
        this.intentosReconexion++;
        setTimeout(() => {
          if (this.escuchaContinuaActiva && !this.estaEscuchando.value) {
            try {
              this.recognition.start();
            } catch (error) {
              console.error('Error al reiniciar reconocimiento:', error);
              if (String(error).includes('already started')) {
                console.log('🎤 Reconocimiento ya está corriendo después del reinicio');
                this.estaEscuchando.next(true);
                this.estadoVoz.next('listening');
              } else {
                this.intentosReconexion = this.maxIntentos; // Detener reintentos
              }
            }
          }
        }, 1000);
      }
    };

    this.recognition.onresult = (event: any) => {
      let textoCompleto = '';
      let textoTemporal = '';

      // Procesar todos los resultados
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          textoCompleto += transcript;
        } else {
          textoTemporal += transcript;
        }
      }

      const textoParaProcesar = (textoCompleto || textoTemporal).toLowerCase().trim();
      console.log('🎤 Texto detectado:', textoParaProcesar);      // Detectar palabra de activación
      if (this.detectarPalabraActivacion(textoParaProcesar)) {
        this.estadoVoz.next('processing');
        this.procesarComandoConActivacion(textoParaProcesar);
      }
    };    this.recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);

      // Manejar errores específicos
      if (event.error === 'no-speech' || event.error === 'audio-capture') {
        // Errores normales en escucha continua, reintentar
        if (this.escuchaContinuaActiva && this.intentosReconexion < this.maxIntentos) {
          setTimeout(() => {
            if (this.escuchaContinuaActiva && !this.estaEscuchando.value) {
              try {
                this.recognition.start();
              } catch (error) {
                console.error('Error al reintentar reconocimiento:', error);
                if (!String(error).includes('already started')) {
                  this.intentosReconexion++;
                }
              }
            }
          }, 2000);
        }
      } else if (event.error === 'not-allowed') {
        // Permisos denegados - detener escucha continua
        console.error('❌ Permisos de micrófono denegados');
        this.escuchaContinuaActiva = false;
        this.estaEscuchando.next(false);
        this.estadoVoz.next('idle');
      } else {
        this.estaEscuchando.next(false);
        this.estadoVoz.next('idle');

        // Para otros errores, no reintentar automáticamente
        if (event.error !== 'aborted') {
          this.intentosReconexion++;
        }
      }
    };
  }

  private inicializarVoces() {
    const cargarVoces = () => {
      this.voces = this.speechSynthesis.getVoices();
      this.seleccionarVozFemenina();
    };

    if (this.speechSynthesis.onvoiceschanged !== undefined) {
      this.speechSynthesis.onvoiceschanged = cargarVoces;
    }

    // Cargar voces inmediatamente si ya están disponibles
    cargarVoces();
  }

  private seleccionarVozFemenina() {
    // Prioridades para voces femeninas en español
    const prioridades = [
      // Chrome/Edge
      'Microsoft Sabina - Spanish (Mexico)',
      'Microsoft Helena - Spanish (Spain)',
      'Google español',
      'es-ES-Standard-A',
      // Firefox
      'es-ES',
      'es-MX'
    ];

    for (const nombrePrioridad of prioridades) {
      const voz = this.voces.find(v =>
        v.name.includes(nombrePrioridad) ||
        v.lang.includes(nombrePrioridad)
      );
      if (voz) {
        this.vozSeleccionada = voz;
        console.log('🔊 Voz seleccionada:', voz.name);
        return;
      }
    }

    // Fallback: cualquier voz en español
    const vozEspanol = this.voces.find(v => v.lang.startsWith('es'));
    if (vozEspanol) {
      this.vozSeleccionada = vozEspanol;
      console.log('🔊 Voz fallback seleccionada:', vozEspanol.name);
    }
  }
  // ========== MÉTODOS DE ACTIVACIÓN POR PALABRA CLAVE ==========

  /**
   * Detecta si el texto contiene la palabra de activación "Viernes"
   */
  private detectarPalabraActivacion(texto: string): boolean {
    const palabras = texto.toLowerCase().split(' ');
    const contieneViernes = palabras.some(palabra =>
      palabra.includes(this.palabraActivacion) ||
      palabra.includes('viern') || // Para "viernes" cortado
      palabra.includes('friday') // Por si detecta en inglés
    );

    if (contieneViernes) {
      console.log('🔔 Palabra de activación "Viernes" detectada!');
      this.palabraActivacionDetectada.next(texto);
    }

    return contieneViernes;
  }
  /**
   * Procesa comando después de detectar palabra de activación
   */
  private procesarComandoConActivacion(textoCompleto: string) {
    // Extraer comando después de "viernes"
    const comando = this.extraerComandoDespuesDeViernes(textoCompleto);

    if (comando.trim().length > 0) {
      console.log('🤖 Comando extraído para Viernes:', comando);

      // Verificar si es un comando duplicado
      if (this.esComandoDuplicado(comando)) {
        console.log('🚫 Comando duplicado detectado, ignorando:', comando);
        return;
      }

      // Agregar comando al historial
      this.agregarComandoAlHistorial(comando);

      // Sin confirmación de voz - solo efecto visual

      // Crear objeto de comando y procesarlo
      const comandoVoz: ComandoVoz = {
        texto: comando,
        confianza: 0.9,
        timestamp: new Date()
      };

      // Emitir comando para procesamiento
      this.comandosDetectados.next(comandoVoz);
    } else {
      // Solo se dijo "Viernes" sin comando - sin respuesta de voz
      console.log('🔔 Solo se detectó "Viernes" sin comando adicional');
    }
  }

  /**
   * Extrae el comando real después de la palabra "viernes"
   */
  private extraerComandoDespuesDeViernes(texto: string): string {
    const textoLower = texto.toLowerCase();

    // Buscar diferentes variaciones de la palabra de activación
    const variaciones = ['viernes', 'viern', 'friday'];

    for (const variacion of variaciones) {
      const indice = textoLower.indexOf(variacion);
      if (indice !== -1) {
        // Extraer todo lo que viene después de la palabra + espacio
        let comando = texto.substring(indice + variacion.length).trim();

        // Limpiar palabras de conexión comunes
        comando = comando.replace(/^(,|\.|\:|por favor|ayuda|ayúdame)/i, '').trim();

        return comando;
      }
    }

    return texto; // Fallback
  }

  // ========== MÉTODOS DE ESCUCHA CONTINUA ==========
  /**
   * Inicia escucha continua estilo Alexa (automático al entrar a cocina)
   */
  iniciarEscuchaContinua(): boolean {
    if (!this.soporteVoz || !this.recognition) {
      console.warn('No se puede iniciar escucha continua: sin soporte de voz');
      return false;
    }

    // Verificar si ya está escuchando para evitar error "already started"
    if (this.estaEscuchando.value) {
      console.log('🎤 La escucha continua ya está activa');
      this.escuchaContinuaActiva = true;
      return true;
    }

    try {
      this.escuchaContinuaActiva = true;
      this.intentosReconexion = 0;

      // Verificar el estado del reconocimiento antes de iniciar
      if (this.recognition.state !== 'listening') {
        this.recognition.start();
        console.log('🎤 Escucha continua activada - Viernes está esperando la palabra de activación');
      } else {
        console.log('🎤 Reconocimiento ya estaba corriendo, se mantiene activo');
      }

      return true;
    } catch (error) {
      console.error('Error al iniciar escucha continua:', error);

      // Si es error "already started", considerar exitoso
      if (String(error).includes('already started')) {
        console.log('🎤 Reconocimiento ya estaba iniciado, continuando...');
        this.escuchaContinuaActiva = true;
        return true;
      }

      this.escuchaContinuaActiva = false;
      return false;
    }
  }

  /**
   * Detiene escucha continua
   */  detenerEscuchaContinua() {
    this.escuchaContinuaActiva = false;

    if (this.recognition) {
      this.recognition.stop();
    }

    if (this.timeoutReconocimiento) {
      clearTimeout(this.timeoutReconocimiento);
    }

    // Limpiar síntesis de voz para evitar interrupciones
    this.limpiarSintesis();

    console.log('🎤 Escucha continua desactivada');
    // Sin confirmación de voz - solo indicador visual
  }
  /**
   * Verifica si la escucha continua está activa
   */
  get escuchaContinuaEstaActiva(): boolean {
    return this.escuchaContinuaActiva;
  }

  /**
   * Obtiene el estado actual de la voz
   */
  get estadoVozActual(): 'idle' | 'listening' | 'processing' | 'speaking' {
    return this.estadoVoz.value;
  }

  /**
   * Verifica si está hablando
   */
  get estaHablandoActualmente(): boolean {
    return this.estaHablando.value;
  }
  // ========== MÉTODOS DE COMPATIBILIDAD ==========

  /**
   * Inicia escucha de voz (método legacy - ahora redirige a escucha continua)
   */
  iniciarEscucha(): boolean {
    return this.iniciarEscuchaContinua();
  }

  /**
   * Detener escucha de voz (método legacy)
   */
  detenerEscucha() {
    this.detenerEscuchaContinua();
  }

  // Obtener estado actual (mejorado)
  get estadoActual() {
    return {
      escuchando: this.estaEscuchando.value,
      escuchaContinua: this.escuchaContinuaActiva,
      soporteVoz: this.soporteVoz,
      vozSeleccionada: this.vozSeleccionada?.name || 'No seleccionada',
      palabraActivacion: this.palabraActivacion,
      intentosReconexion: this.intentosReconexion
    };
  }

  // ========== MÉTODOS DE UTILIDAD ==========

  /**
   * Cambia la palabra de activación (por defecto es "viernes")
   */
  cambiarPalabraActivacion(nuevaPalabra: string) {
    this.palabraActivacion = nuevaPalabra.toLowerCase();
    console.log(`🔄 Palabra de activación cambiada a: "${this.palabraActivacion}"`);
  }

  /**
   * Obtiene estadísticas de uso
   */  get estadisticasUso() {
    return {
      escuchaContinuaActiva: this.escuchaContinuaActiva,
      intentosReconexion: this.intentosReconexion,
      palabraActivacionActual: this.palabraActivacion
    };
  }

  // ========== MÉTODOS DE SÍNTESIS DE VOZ ==========

  /**
   * Limpia el sistema de síntesis para evitar errores de interrupción
   */
  private limpiarSintesis() {
    console.log('🧹 Limpiando sistema de síntesis...');

    // Cancelar cualquier síntesis en curso
    if (this.speechSynthesis) {
      this.speechSynthesis.cancel();
    }

    // Limpiar timeout de síntesis
    if (this.timeoutSintesis) {
      clearTimeout(this.timeoutSintesis);
      this.timeoutSintesis = null;
    }

    // Limpiar la cola de síntesis
    this.colaSintesis = [];

    // Resetear estados
    this.sintesisEnCurso = false;
    this.estaHablando.next(false);

    // Actualizar estado de voz
    this.estadoVoz.next(this.escuchaContinuaActiva ? 'listening' : 'idle');

    console.log('✅ Sistema de síntesis limpiado');
  }
  // Hablar texto con gestión mejorada de síntesis
  hablar(texto: string, opciones?: { velocidad?: number; volumen?: number; prioridad?: boolean }) {
    if (!this.speechSynthesis) {
      console.warn('Síntesis de voz no disponible');
      return;
    }

    // Verificar permisos antes de intentar hablar
    if (!this.verificarPermisosSintesis()) {
      console.warn('⚠️ Permisos de síntesis de voz no disponibles');
      return;
    }

    // Si es prioritario o no hay síntesis en curso, hablar inmediatamente
    if (opciones?.prioridad || !this.sintesisEnCurso) {
      this.ejecutarSintesis(texto, opciones);
    } else {
      // Agregar a cola si hay síntesis en curso
      this.colaSintesis.push(texto);
      console.log('🔊 Texto agregado a cola de síntesis:', texto);
    }
  }

  /**
   * Verifica si los permisos de síntesis están disponibles
   */
  private verificarPermisosSintesis(): boolean {
    try {
      // Crear una utterance de prueba silenciosa para verificar permisos
      const testUtterance = new SpeechSynthesisUtterance('');
      testUtterance.volume = 0;

      // Si no hay error al crear, los permisos están OK
      return true;
    } catch (error) {
      console.error('Error al verificar permisos de síntesis:', error);
      return false;
    }
  }

  private ejecutarSintesis(texto: string, opciones?: { velocidad?: number; volumen?: number; prioridad?: boolean }) {
    // Si hay síntesis en curso y es prioritario, cancelar la actual
    if (this.sintesisEnCurso && opciones?.prioridad) {
      this.speechSynthesis.cancel();
      // Esperar un poco para que se complete la cancelación
      setTimeout(() => this.procesarSintesis(texto, opciones), 100);
    } else if (!this.sintesisEnCurso) {
      this.procesarSintesis(texto, opciones);
    }
  }
  private procesarSintesis(texto: string, opciones?: { velocidad?: number; volumen?: number }) {
    this.sintesisEnCurso = true;

    const utterance = new SpeechSynthesisUtterance(texto);

    if (this.vozSeleccionada) {
      utterance.voice = this.vozSeleccionada;
    }

    utterance.rate = opciones?.velocidad || 0.9;
    utterance.volume = opciones?.volumen || 0.8;
    utterance.pitch = 1.1; // Tono ligeramente más alto para voz femenina

    utterance.onstart = () => {
      console.log('🔊 Hablando:', texto);
      this.estaHablando.next(true);
      this.estadoVoz.next('speaking');
    };

    utterance.onend = () => {
      console.log('🔊 Síntesis completada');
      this.sintesisEnCurso = false;
      this.estaHablando.next(false);

      // Procesar siguiente en cola si existe
      this.procesarSiguienteEnCola();
    };

    utterance.onerror = (error) => {
      console.error('Error en síntesis:', error);
      this.sintesisEnCurso = false;
      this.estaHablando.next(false);

      // Manejar diferentes tipos de errores
      if (error.error === 'not-allowed') {
        console.error('❌ Permisos de síntesis de voz denegados');
        // Limpiar cola para evitar más errores
        this.colaSintesis = [];
        this.estadoVoz.next(this.escuchaContinuaActiva ? 'listening' : 'idle');
      } else {
        // Si hay error, procesar siguiente en cola después de un retraso
        setTimeout(() => this.procesarSiguienteEnCola(), 500);
      }
    };

    try {
      // Verificar que speechSynthesis esté disponible antes de usar
      if (this.speechSynthesis && typeof this.speechSynthesis.speak === 'function') {
        this.speechSynthesis.speak(utterance);
      } else {
        throw new Error('speechSynthesis.speak no está disponible');
      }
    } catch (error) {
      console.error('Error al iniciar síntesis:', error);
      this.sintesisEnCurso = false;
      this.estaHablando.next(false);

      // Si es error de permisos, no procesar cola
      if (String(error).includes('not-allowed')) {
        this.colaSintesis = [];
        this.estadoVoz.next(this.escuchaContinuaActiva ? 'listening' : 'idle');
      } else {
        this.procesarSiguienteEnCola();
      }
    }
  }

  private procesarSiguienteEnCola() {
    if (this.colaSintesis.length > 0) {
      const siguienteTexto = this.colaSintesis.shift();
      if (siguienteTexto) {
        console.log('🔊 Procesando siguiente en cola:', siguienteTexto);
        // Pequeño retraso para evitar conflictos
        setTimeout(() => this.procesarSintesis(siguienteTexto), 200);
      }
    } else {
      // No hay más en cola, volver al estado apropiado
      this.estadoVoz.next(this.escuchaContinuaActiva ? 'listening' : 'idle');
    }
  }
  // Procesar comando detectado con IA
  async procesarComandoDetectado(comando: ComandoVoz): Promise<RespuestaAI> {
    try {
      this.estadoVoz.next('processing');

      const response = await this.http.post<any>(`${this.apiUrl}/comando-natural`, {
        comando: comando.texto
      }).toPromise();

      const respuestaAI: RespuestaAI = {
        success: response.success,
        mensaje: response.mensaje,
        accion: response.accion,
        mesa: response.mesa,
        confianza: response.confianza,
        respuestaAI: response.respuestaAI,
        comandoOriginal: response.comandoOriginal
      };

      // Hablar la respuesta de la IA (esto activará el estado 'speaking')
      if (respuestaAI.respuestaAI) {
        this.hablar(respuestaAI.respuestaAI);
      } else {
        // Si no hay respuesta de voz, volver al estado de escucha
        this.estadoVoz.next(this.escuchaContinuaActiva ? 'listening' : 'idle');
      }

      return respuestaAI;    } catch (error) {
      console.error('Error al procesar comando con IA:', error);
      const mensajeError = 'Lo siento, no pude procesar tu comando en este momento';
      // ⚠️ NO HABLAR AQUÍ - evita duplicación de audio
      // La IA backend ya maneja las respuestas de error

      return {
        success: false,
        mensaje: mensajeError,
        comandoOriginal: comando.texto
      };
    }  }

  // ========== MÉTODOS DE CONTROL MANUAL ==========

  /**
   * Detiene cualquier síntesis de voz en curso y limpia el sistema
   * Método público para casos de emergencia o limpieza manual
   */
  detenerSintesis() {
    this.limpiarSintesis();
    console.log('🛑 Síntesis de voz detenida manualmente');
  }

  /**
   * Obtiene información del estado actual de la síntesis
   */
  get estadoSintesis() {
    return {
      sintesisEnCurso: this.sintesisEnCurso,
      colaTamano: this.colaSintesis.length,
      estaHablando: this.estaHablando.value,
      vozSeleccionada: this.vozSeleccionada?.name || 'No seleccionada'
    };
  }

  /**
   * Solicita permisos de micrófono y síntesis de voz de forma proactiva
   */
  async solicitarPermisos(): Promise<boolean> {
    try {
      console.log('🔒 Solicitando permisos de voz...');

      // Solicitar permisos de micrófono
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          console.log('✅ Permisos de micrófono otorgados');

          // Detener el stream inmediatamente
          stream.getTracks().forEach(track => track.stop());
        } catch (micError) {
          console.warn('⚠️ Permisos de micrófono denegados:', micError);
          return false;
        }
      }

      // Verificar síntesis de voz con una prueba silenciosa
      if (this.speechSynthesis) {
        try {
          const testUtterance = new SpeechSynthesisUtterance('test');
          testUtterance.volume = 0;
          testUtterance.rate = 10; // Muy rápido para que termine rápido

          await new Promise<void>((resolve, reject) => {
            testUtterance.onend = () => resolve();
            testUtterance.onerror = (error) => {
              if (error.error === 'not-allowed') {
                reject(new Error('Permisos de síntesis denegados'));
              } else {
                resolve(); // Otros errores son tolerables
              }
            };

            // Timeout de seguridad
            setTimeout(() => resolve(), 2000);

            this.speechSynthesis.speak(testUtterance);
          });

          console.log('✅ Permisos de síntesis de voz verificados');
        } catch (synthError) {
          console.warn('⚠️ Problema con síntesis de voz:', synthError);
          // No es crítico, continuar
        }
      }      return true;
    } catch (error) {
      console.error('❌ Error al solicitar permisos:', error);
      return false;
    }
  }

  // ========== MÉTODOS DE DEDUPLICACIÓN ==========
  /**
   * Verifica si un comando es duplicado comparándolo con el historial reciente
   */
  private esComandoDuplicado(comando: string): boolean {
    const ahora = Date.now();
    const comandoLimpio = this.limpiarComandoParaComparar(comando);

    // Limpiar historial de comandos antiguos
    this.historialComandos = this.historialComandos.filter(
      item => (ahora - item.timestamp) < this.TIEMPO_DEDUPLICACION
    );

    // Verificar similitud con comandos recientes
    for (const item of this.historialComandos) {
      const similitud = this.calcularSimilitudTexto(comandoLimpio, item.comando);
      if (similitud >= this.UMBRAL_SIMILITUD) {
        console.log(`🔍 Comando similar encontrado: "${item.comando}" vs "${comandoLimpio}" (similitud: ${similitud.toFixed(2)})`);
        return true;
      }
    }

    return false;
  }

  /**
   * Agrega un comando al historial para deduplicación
   */
  private agregarComandoAlHistorial(comando: string): void {
    const comandoLimpio = this.limpiarComandoParaComparar(comando);
    this.historialComandos.push({
      comando: comandoLimpio,
      timestamp: Date.now()
    });

    // Mantener solo los últimos 10 comandos
    if (this.historialComandos.length > 10) {
      this.historialComandos = this.historialComandos.slice(-10);
    }
  }

  /**
   * Limpia un comando para comparación (normaliza texto)
   */
  private limpiarComandoParaComparar(comando: string): string {
    return comando.toLowerCase()
      .replace(/[.,;:!?¡¿]/g, '') // Quitar puntuación
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Calcula la similitud entre dos textos usando distancia de Levenshtein normalizada
   */
  private calcularSimilitudTexto(texto1: string, texto2: string): number {
    if (texto1 === texto2) return 1.0;
    if (texto1.length === 0 || texto2.length === 0) return 0.0;

    const distancia = this.calcularDistanciaLevenshtein(texto1, texto2);
    const longitudMaxima = Math.max(texto1.length, texto2.length);

    return 1 - (distancia / longitudMaxima);
  }

  /**
   * Calcula la distancia de Levenshtein entre dos strings
   */
  private calcularDistanciaLevenshtein(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
