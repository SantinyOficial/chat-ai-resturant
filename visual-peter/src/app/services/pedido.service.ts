import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO = 'LISTO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO'
}

export interface PedidoItem {
  nombre: string;
  descripcion?: string;
  categoria: string;
  cantidad: number;
  precio: number;
}

export interface Pedido {
  id?: string;
  clienteNombre: string;
  clienteId?: string;
  mesa: number;
  items: PedidoItem[];
  total: number;
  estado: EstadoPedido;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  observaciones?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PedidoService {
  private apiUrl = '/api/pedidos';

  constructor(private http: HttpClient) {}

  getAllPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  getPedidoById(id: string): Observable<Pedido> {
    return this.http.get<Pedido>(`${this.apiUrl}/${id}`);
  }

  getPedidosByCliente(clienteId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  getPedidosActivosByCliente(clienteId: string): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/cliente/${clienteId}/activos`);
  }

  getPedidosByEstado(estado: EstadoPedido): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/estado/${estado}`);
  }

  getPedidosByMesa(mesa: number): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/mesa/${mesa}`);
  }

  crearPedido(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  actualizarPedido(id: string, pedido: Pedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}`, pedido);
  }

  actualizarEstadoPedido(id: string, estado: EstadoPedido): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/estado`, null, {
      params: { estado: estado.toString() }
    });
  }

  eliminarPedido(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cancelarPedido(id: string): Observable<Pedido> {
    return this.http.put<Pedido>(`${this.apiUrl}/${id}/cancelar`, null);
  }
}
