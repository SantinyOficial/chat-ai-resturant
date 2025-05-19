import { Component, ViewChild, ElementRef, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssistantService, ChatRequest, ChatResponse, ChatMessage } from '../../services/assistant.service';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],  template: `
    <div class="container">
      <h2><i class="material-icons">support_agent</i> Chat Asistente</h2>
      <div class="chat-container">
        <div class="chat-header">          <div class="agent-info">
            <i class="material-icons agent-avatar">restaurant</i>
            <span class="agent-name">Asistente de Banquetes Peter</span>
          </div>
          <span [class]="'status ' + (error ? 'offline' : 'online')">
            {{ error ? 'Sin conexión' : 'En línea' }}
          </span>
        </div>

        <div class="chat-messages" #scrollContainer>
          <div class="message bot">
            <div class="message-bubble">
              <p>Bienvenido al asistente de Banquetes Peter. ¿En qué puedo ayudarte hoy?</p>
            </div>
            <span class="message-time">Ahora</span>
          </div>

          <div *ngFor="let message of messages" [class]="'message ' + message.sender">
            <div class="message-bubble">
              <p>{{ message.text }}</p>
            </div>
            <span class="message-time">{{ message.time }}</span>
          </div>

          <div *ngIf="loading" class="message bot loading">
            <div class="message-bubble">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>

          <div *ngIf="error" class="error-message">
            {{ error }}
          </div>
        </div>

        <div class="chat-input">
          <input
            type="text"
            [(ngModel)]="userMessage"
            placeholder="Escribe tu mensaje aquí..."
            (keyup.enter)="sendMessage()"
            [disabled]="loading"
          >
          <button (click)="sendMessage()" [disabled]="loading || !userMessage.trim()">
            <i class="material-icons">send</i>
          </button>
        </div>
      </div>
    </div>
  `,styles: [`
    .container {
      padding: 0;
      max-width: 850px;
      margin: 0 auto;
    }

    h2 {
      color: var(--primary-color);
      margin-bottom: 25px;
      font-size: 1.8rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    h2 .material-icons {
      font-size: 2rem;
    }

    .chat-container {
      background: var(--background-medium);
      border-radius: 16px;
      box-shadow: 0 8px 25px rgba(0,0,0,0.2);
      border: 2px solid var(--primary-color);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: calc(80vh - 120px);
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,204,41,0.3);
    }

    .agent-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .agent-avatar {
      background: var(--primary-color);
      color: var(--background-dark);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      padding: 5px;
    }

    .agent-name {
      font-weight: 600;
      font-size: 1.1rem;
    }

    .status {
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 5px;
    }    .status.online::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #4CAF50;
      border-radius: 50%;
    }

    .status.offline::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #f44336;
      border-radius: 50%;
    }

    .chat-messages {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .message {
      display: flex;
      flex-direction: column;
      max-width: 80%;
    }

    .message.user {
      align-self: flex-end;
    }

    .message.bot {
      align-self: flex-start;
    }

    .message-bubble {
      padding: 12px 16px;
      border-radius: 18px;
      position: relative;
      word-break: break-word;
    }

    .message.user .message-bubble {
      background: var(--primary-color);
      color: var(--background-dark);
      border-bottom-right-radius: 4px;
    }

    .message.bot .message-bubble {
      background: #333;
      color: #fff;
      border-bottom-left-radius: 4px;
    }

    .message-time {
      font-size: 0.75rem;
      margin-top: 5px;
      opacity: 0.6;
      align-self: flex-end;
    }

    .message.bot .message-time {
      align-self: flex-start;
    }

    .chat-input {
      display: flex;
      gap: 10px;
      padding: 15px 20px;
      background: rgba(0,0,0,0.2);
      border-top: 1px solid rgba(255,204,41,0.3);
    }

    input {
      flex: 1;
      padding: 14px 16px;
      border-radius: 25px;
      border: 1px solid rgba(255,204,41,0.3);
      background: rgba(255,255,255,0.05);
      color: #fff;
      font-size: 1rem;
      font-family: 'Quicksand', sans-serif;
    }

    input:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 5px var(--primary-color);
    }

    button {
      width: 50px;
      height: 50px;
      background: var(--primary-color);
      color: var(--background-dark);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    button .material-icons {
      font-size: 1.3rem;
    }    button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 8px var(--primary-color);
    }

    button:disabled {
      background: #555;
      cursor: not-allowed;
      opacity: 0.7;
    }

    button:disabled:hover {
      transform: none;
      box-shadow: none;
    }

    .error-message {
      color: #ff5252;
      text-align: center;
      margin: 10px 0;
      font-size: 0.9rem;
    }

    .typing-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 5px;
      height: 20px;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      display: inline-block;
      animation: bounce 1s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(1) {
      animation-delay: 0s;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-6px); }
    }

    @media (max-width: 768px) {
      .chat-container {
        height: calc(75vh - 80px);
      }

      h2 {
        font-size: 1.5rem;
      }

      .chat-messages {
        padding: 15px;
      }

      .message {
        max-width: 90%;
      }
    }
  `]
})
export class ChatAsistenteComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  
  userMessage: string = '';
  messages: {sender: string, text: string, time: string}[] = [];
  loading: boolean = false;
  error: string = '';
  currentConversationId: string | null = null;

  constructor(private assistantService: AssistantService) {}
  ngOnInit(): void {
    // Verificar la conexión con el backend al inicio
    this.checkBackendConnection();
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

    // Crear la solicitud para el backend
    const request: ChatRequest = {
      message: messageText,
      conversationId: this.currentConversationId || undefined
    };

    console.log('Enviando mensaje al backend:', request);

    // Enviar el mensaje al servicio
    this.assistantService.sendMessage(request).subscribe({
      next: (response: ChatResponse) => {
        console.log('Respuesta recibida:', response);
        // Guardar el ID de conversación para futuros mensajes
        this.currentConversationId = response.conversationId;

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
    
    const directUrl = 'http://localhost:8080/api/assistant/chat';
    this.assistantService.sendMessageDirect(request, directUrl).subscribe({
      next: (response: ChatResponse) => {
        console.log('Conexión directa exitosa:', response);
        this.currentConversationId = response.conversationId;
        
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
  }
  
  private handleError(err: any): void {
    let errorMsg = 'Lo siento, ha ocurrido un error al procesar tu solicitud. Por favor, intenta nuevamente.';
    
    if (err.status === 0) {
      errorMsg = 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
      this.error = 'Error de conexión: No se pudo establecer comunicación con el servidor';
    } else if (err.status === 404) {
      errorMsg = 'El servicio de chat no está disponible en este momento. Por favor, intenta más tarde.';
      this.error = 'Error 404: Servicio no encontrado';
    } else if (err.status === 500) {
      errorMsg = 'El servidor encontró un error interno. Por favor, intenta más tarde.';
      this.error = 'Error 500: Error interno del servidor';
    } else {
      this.error = `Error ${err.status}: ${err.statusText || 'Error desconocido'}`;
    }
    
    this.messages.push({
      sender: 'bot',
      text: errorMsg,
      time: this.formatTime()
    });
    
    this.loading = false;
  }
}
