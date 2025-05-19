import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ChatRequest {
  message: string;
  conversationId?: string;
  userId?: string;
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

  constructor(private http: HttpClient) {}
  sendMessage(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.apiUrl}/chat`, request);
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
    return this.http.delete(`${this.apiUrl}/conversations/${conversationId}`);
  }

  getHealth() {
    return this.http.get<{status: string, message: string}>(`${this.apiUrl}/health`);
  }
}
