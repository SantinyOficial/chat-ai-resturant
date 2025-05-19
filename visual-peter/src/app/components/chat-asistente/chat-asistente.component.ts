import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-asistente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h2><i class="material-icons">support_agent</i> Chat Asistente</h2>
      <div class="chat-container">
        <div class="chat-header">
          <div class="agent-info">
            <i class="material-icons agent-avatar">restaurant</i>
            <span class="agent-name">Asistente de Banquetes Peter</span>
          </div>
          <span class="status online">En línea</span>
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
        </div>

        <div class="chat-input">
          <input
            type="text"
            [(ngModel)]="userMessage"
            placeholder="Escribe tu mensaje aquí..."
            (keyup.enter)="sendMessage()"
          >
          <button (click)="sendMessage()">
            <i class="material-icons">send</i>
          </button>
        </div>
      </div>
    </div>
  `,  styles: [`
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
    }

    .status.online::before {
      content: '';
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #4CAF50;
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
    }

    button:hover {
      transform: scale(1.05);
      box-shadow: 0 0 8px var(--primary-color);
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
export class ChatAsistenteComponent {
  userMessage: string = '';
  messages: {sender: string, text: string, time: string}[] = [];

  sendMessage() {
    if (!this.userMessage.trim()) return;

    // Agregar mensaje del usuario
    this.messages.push({
      sender: 'user',
      text: this.userMessage,
      time: 'Ahora'
    });

    // Simular respuesta del bot (aquí se conectaría con el backend)
    setTimeout(() => {
      this.messages.push({
        sender: 'bot',
        text: 'Gracias por tu mensaje. ¿En qué más puedo ayudarte con respecto a nuestros servicios de banquetes?',
        time: 'Ahora'
      });
    }, 1000);

    this.userMessage = '';
  }
}
