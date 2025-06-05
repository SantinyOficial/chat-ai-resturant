import { Component, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatRequest, ChatResponse, ChatMessage } from '../../services/assistant.service';
import { RealizarPedidoComponent } from '../realizar-pedido/realizar-pedido.component';
import { Pedido, PedidoService } from '../../services/pedido.service';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';

// Interfaz local para mensajes en el chat (para uso en UI)
interface UIChatMessage {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule, RealizarPedidoComponent],
  templateUrl: './chat-asistente.component.html',
  styleUrls: ['./chat-asistente.component.scss']
})
export class ChatAsistenteComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  messages: UIChatMessage[] = [];
  userMessage: string = '';
  loading: boolean = false;
  error: string = '';
  currentConversationId: string | null = null;
  mostrarRealizarPedido: boolean = false;
  // ID del cliente (debería ser dinámico basado en el usuario autenticado)
  clienteId: string = localStorage.getItem('clienteId') || 'cliente-' + Math.floor(Math.random() * 1000);

  // Para actualización periódica de pedidos
  private pedidosInterval: any;
  private pedidosSubscription: Subscription | null = null;

  constructor(
    private assistantService: AssistantService,
    private pedidoService: PedidoService
  ) {}

  ngOnInit(): void {
    // Guardar clienteId para su uso posterior
    localStorage.setItem('clienteId', this.clienteId);

    // Verificar la conexión con el backend al inicio
    this.checkBackendConnection();

    // Recuperar conversación anterior si existe
    const savedConversationId = localStorage.getItem('currentConversationId');
    if (savedConversationId) {
      const lastActivity = localStorage.getItem('lastChatActivity');
      // Verificar si la última actividad fue hace menos de 6 minutos (360000ms)
      if (lastActivity && (Date.now() - parseInt(lastActivity)) < 360000) {
        this.currentConversationId = savedConversationId;
        this.loadPreviousMessages();
      } else {
        // Si ha pasado más de 6 minutos, limpiar la conversación anterior
        localStorage.removeItem('currentConversationId');
        localStorage.removeItem('lastChatActivity');
      }
    }

    // Configurar una actualización periódica de información de pedidos
    this.pedidosInterval = setInterval(() => {
      this.refreshPedidosContext();
    }, 30000); // Cada 30 segundos
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruye
    if (this.pedidosInterval) {
      clearInterval(this.pedidosInterval);
    }

    // Cancelar suscripciones activas
    if (this.pedidosSubscription) {
      this.pedidosSubscription.unsubscribe();
    }
  }

  // Método para actualizar el contexto de pedidos en tiempo real
  refreshPedidosContext() {
    if (!this.currentConversationId) return; // Solo si hay una conversación activa

    this.pedidosSubscription = this.pedidoService.getPedidosByCliente(this.clienteId).subscribe({
      next: (pedidos) => {
        if (pedidos && pedidos.length > 0) {
          // Solo actualizar si hay pedidos activos pendientes
          const pedidosActivos = pedidos.filter(p =>
            p.estado !== 'ENTREGADO' && p.estado !== 'CANCELADO'
          );

          if (pedidosActivos.length > 0) {            // Enviar mensaje silencioso para actualizar el contexto
            const updateRequest: ChatRequest = {
              message: "_actualización_de_contexto_", // Mensaje especial que podría ser ignorado en la UI
              conversationId: this.currentConversationId || undefined,
              userId: this.clienteId
            };

            this.assistantService.sendMessage(updateRequest).subscribe({
              next: () => console.log('Contexto de pedidos actualizado silenciosamente'),
              error: (err) => console.error('Error actualizando contexto de pedidos:', err)
            });
          }
        }
      },
      error: (err) => console.error('Error consultando pedidos para actualización de contexto:', err)
    });
  }

  /**
   * Cargar mensajes anteriores de la conversación actual
   */
  loadPreviousMessages(): void {
    if (!this.currentConversationId) return;

    this.loading = true;
    this.assistantService.getConversationMessages(this.currentConversationId).subscribe({
      next: (messages) => {
        // Transformar mensajes del backend al formato de la UI
        this.messages = messages.map(msg => ({
          sender: msg.role === 'user' ? 'user' : 'bot',
          text: msg.content,
          time: this.formatTimeFromTimestamp(msg.timestamp || '')
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar mensajes anteriores:', err);
        this.loading = false;
        // Si hay error, mejor empezar una conversación nueva
        this.currentConversationId = null;
        localStorage.removeItem('currentConversationId');
      }
    });
  }

  /**
   * Formatear timestamp del servidor a formato de hora local
   */
  formatTimeFromTimestamp(timestamp: string): string {
    if (!timestamp) return 'Desconocido';

    try {
      const date = new Date(timestamp);
      return date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
    } catch (e) {
      return 'Desconocido';
    }
  }

  checkBackendConnection(): void {
    this.loading = true;
    this.assistantService.getHealth().subscribe({
      next: (response) => {
        console.log('Backend conectado:', response);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al conectar con el backend:', err);
        this.error = 'No se pudo conectar con el servidor. Por favor, verifica que el backend esté en ejecución.';
        this.loading = false;
      }
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  formatTime(): string {
    const now = new Date();
    return now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
  }
  sendMessage() {
    if (!this.userMessage.trim() || this.loading) return;

    const messageText = this.userMessage.trim();
    this.userMessage = '';
    this.error = '';
    this.loading = true;

    // Agregar mensaje del usuario a la UI
    this.messages.push({
      sender: 'user',
      text: messageText,
      time: this.formatTime()
    });

    // Crear la solicitud para el backend con el ID del cliente
    const request: ChatRequest = {
      message: messageText,
      conversationId: this.currentConversationId || undefined,
      userId: this.clienteId // Incluir ID del cliente para contextualizar la conversación
    };

    console.log('Enviando mensaje al backend:', request);

    // Enviar el mensaje al servicio
    this.assistantService.sendMessage(request).subscribe({
      next: (response: ChatResponse) => {
        console.log('Respuesta recibida:', response);
        // Guardar el ID de conversación para futuros mensajes
        this.currentConversationId = response.conversationId;

        // Guardar ID de conversación y tiempo de última actividad
        localStorage.setItem('currentConversationId', response.conversationId);
        localStorage.setItem('lastChatActivity', Date.now().toString());

        // Agregar la respuesta del bot a la UI
        this.messages.push({
          sender: 'bot',
          text: response.message.content,
          time: this.formatTime()
        });

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al enviar mensaje:', err);

        // Intentar conexión directa con el backend
        this.tryDirectConnection(request);
      }
    });
  }

  private tryDirectConnection(request: ChatRequest): void {
    console.log('Intentando conexión directa con el backend');

    const directUrl = `${environment.apiUrl}/api/assistant/chat`;
    this.assistantService.sendMessageDirect(request, directUrl).subscribe({
      next: (response: ChatResponse) => {
        console.log('Conexión directa exitosa:', response);
        this.currentConversationId = response.conversationId;

        // Guardar ID de conversación y tiempo de última actividad
        localStorage.setItem('currentConversationId', response.conversationId);
        localStorage.setItem('lastChatActivity', Date.now().toString());

        this.messages.push({
          sender: 'bot',
          text: response.message.content,
          time: this.formatTime()
        });

        this.loading = false;
      },
      error: (directErr) => {
        console.error('Error también en conexión directa:', directErr);
        this.handleError(directErr);
      }
    });
  }  private handleError(err: any): void {
    // Mensajes amigables para demo
    const demoMessages: {[key: number]: string} = {
      0: '🔄 Conectando con el asistente... Por favor espera un momento.',
      404: '🤖 El asistente está inicializándose. Inténtalo en unos segundos.',
      500: '⚡ Nuestro asistente está procesando muchas consultas. Inténtalo nuevamente.',
      503: '🔧 El asistente está en mantenimiento. Volverá pronto.'
    };

    const userMessage = demoMessages[err.status] ||
      '🎯 El asistente está disponible. ¿Puedes reformular tu pregunta?';

    // Error técnico para desarrolladores (en consola)
    console.error('🔍 Error técnico del chat:', err);

    // Mensaje simple para logs internos
    if (err.status === 0) {
      this.error = 'Conexión: Verificar backend';
    } else if (err.status === 404) {
      this.error = 'Servicio: No encontrado';
    } else if (err.status === 500) {
      this.error = 'Servidor: Error interno';
    } else {
      this.error = `Estado: ${err.status}`;
    }    // Mensaje amigable para el usuario
    this.messages.push({
      sender: 'bot',
      text: userMessage,
      time: this.formatTime()
    });

    this.loading = false;
  }

  abrirRealizarPedido() {
    this.mostrarRealizarPedido = true;
  }

  cerrarRealizarPedido() {
    this.mostrarRealizarPedido = false;
  }

  onPedidoCreado(pedido: Pedido) {
    console.log('Pedido creado:', pedido);

    // Añadir mensaje informativo sobre el pedido creado
    this.messages.push({
      sender: 'bot',
      text: `¡Tu pedido ha sido creado exitosamente! Tu número de pedido es: ${pedido.id}.
             Puedes consultar el estado de tu pedido en cualquier momento preguntándome o
             visitando la sección de Pedidos.`,
      time: this.formatTime()
    });

    // Cerrar el modal y reiniciar estados
    this.loading = false;
    this.cerrarRealizarPedido();

    // Guardar tiempo de última actividad
    localStorage.setItem('lastChatActivity', Date.now().toString());

    // Enviar un mensaje automático para actualizar el contexto de la conversación
    if (this.currentConversationId) {
      const updateRequest: ChatRequest = {
        message: "Mi pedido fue creado, ¿puedes actualizarme sobre su estado?",
        conversationId: this.currentConversationId,
        userId: this.clienteId
      };

      // No mostrar este mensaje al usuario, solo actualizar el contexto de la conversación
      this.assistantService.sendMessage(updateRequest).subscribe({
        next: (response: ChatResponse) => {
          console.log('Contexto de conversación actualizado con nuevo pedido');
        },
        error: (err) => {
          console.error('Error al actualizar contexto con el nuevo pedido:', err);
        }
      });
    }
  }

  /**
   * Enviar una pregunta rápida al asistente
   */
  sendQuickQuestion(question: string) {
    // Establecer la pregunta en el campo de entrada
    this.userMessage = question;
    // Enviar el mensaje
    this.sendMessage();
  }
}
