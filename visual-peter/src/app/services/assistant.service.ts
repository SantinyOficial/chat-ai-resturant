import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { PedidoService, Pedido, EstadoPedido } from './pedido.service';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;
  pedidoInfo?: PedidoInfo;
}

export interface PedidoInfo {
  hasPedidos: boolean;
  pedidoCount?: number;
  lastPedidoId?: string;
  lastPedidoStatus?: string;
}

export interface ChatMessage {
  id?: string;
  content: string;
  role: string;
  timestamp?: string;
  conversationId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
  isNewConversation: boolean;
}

@Injectable({ providedIn: 'root' })
export class AssistantService {
  private apiUrl = `${environment.apiUrl}/api/assistant`;
  private clienteId: string = 'cliente-' + Math.floor(Math.random() * 1000);
  private conversationTimeouts: Map<string, any> = new Map();

  constructor(
    private http: HttpClient,
    private pedidoService: PedidoService
  ) {}

  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    // Enriquecer la solicitud con información de pedidos
    return this.enrichRequestWithPedidoInfo(request).pipe(
      tap(enrichedRequest => {
        // Mantener la conversación activa por 6 minutos
        if (enrichedRequest.conversationId) {
          this.refreshConversationTimeout(enrichedRequest.conversationId);
        }
      }),
      switchMap(enrichedRequest => {
        return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, enrichedRequest);
      }),
      tap(response => {
        // Si es una nueva conversación, configurar el timeout
        if (response && response.isNewConversation && response.conversationId) {
          this.refreshConversationTimeout(response.conversationId);
        }
      }),
      catchError(error => {
        console.error('Error al enviar mensaje al asistente', error);
        // Si falla con la información enriquecida, intentar con la solicitud original
        return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, request);
      })
    );
  }

  private enrichRequestWithPedidoInfo(request: ChatRequest): Observable<ChatRequest> {
    return this.pedidoService.getPedidosByCliente(this.clienteId).pipe(
      map(pedidos => {
        const hasPedidos = pedidos && pedidos.length > 0;
        const pedidoInfo: PedidoInfo = {
          hasPedidos,
          pedidoCount: pedidos.length
        };

        if (hasPedidos) {
          // Obtener información del último pedido
          const lastPedido = this.getLastActivePedido(pedidos);
          if (lastPedido) {
            pedidoInfo.lastPedidoId = lastPedido.id;
            pedidoInfo.lastPedidoStatus = lastPedido.estado;
          }
        }

        return {
          ...request,
          userId: this.clienteId,
          pedidoInfo
        };
      }),
      catchError(error => {
        console.error('Error al obtener información de pedidos', error);
        return of(request);
      })
    );
  }

  private getLastActivePedido(pedidos: Pedido[]): Pedido | null {
    // Ordenar por fecha (más recientes primero)
    const sortedPedidos = [...pedidos].sort((a, b) => {
      const dateA = a.fechaCreacion ? new Date(a.fechaCreacion) : new Date();
      const dateB = b.fechaCreacion ? new Date(b.fechaCreacion) : new Date();
      return dateB.getTime() - dateA.getTime();
    });

    // Encontrar el último pedido activo
    return sortedPedidos.find(p =>
      p.estado !== EstadoPedido.ENTREGADO && p.estado !== EstadoPedido.CANCELADO
    ) || (sortedPedidos.length > 0 ? sortedPedidos[0] : null);
  }

  // Configurar un timeout para mantener la conversación activa por 6 minutos
  private refreshConversationTimeout(conversationId: string): void {
    // Limpiar el timeout anterior si existe
    if (this.conversationTimeouts.has(conversationId)) {
      clearTimeout(this.conversationTimeouts.get(conversationId));
    }

    // Configurar un nuevo timeout (6 minutos = 360000ms)
    const timeout = setTimeout(() => {
      console.log(`Conversación ${conversationId} expirada después de 6 minutos de inactividad`);
      this.conversationTimeouts.delete(conversationId);
    }, 360000);

    this.conversationTimeouts.set(conversationId, timeout);
  }

  sendMessageDirect(request: ChatRequest, directUrl: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(directUrl, request);
  }

  getAllConversations() {
    return this.http.get<any[]>(`${this.apiUrl}/conversations`);
  }

  getUserConversations(userId: string) {
    return this.http.get<any[]>(`${this.apiUrl}/conversations/user/${userId}`);
  }

  getConversationMessages(conversationId: string) {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/conversations/${conversationId}/messages`);
  }

  deleteConversation(conversationId: string) {
    // Limpiar el timeout si existe
    if (this.conversationTimeouts.has(conversationId)) {
      clearTimeout(this.conversationTimeouts.get(conversationId));
      this.conversationTimeouts.delete(conversationId);
    }
    return this.http.delete(`${this.apiUrl}/conversations/${conversationId}`);
  }

  getHealth() {
    return this.http.get<{status: string, message: string}>(`${this.apiUrl}/health`);
  }
}
