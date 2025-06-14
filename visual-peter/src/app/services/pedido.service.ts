import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EstadoPedido } from '../models/enums';

// Re-exportar para compatibilidad
export { EstadoPedido } from '../models/enums';

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
  // Campos para domicilio
  tipoPedido?: 'mesa' | 'domicilio';
  telefono?: string;
  direccion?: string;
  barrio?: string;
  referencia?: string;
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
    // Validar que todos los ítems del pedido tengan precios válidos
    const itemsSinPrecio = pedido.items.filter(item => !item.precio || item.precio <= 0);

    if (itemsSinPrecio.length > 0) {
      console.error('El pedido contiene ítems sin precio válido:',
        itemsSinPrecio.map(item => item.nombre).join(', '));

      // Eliminar ítems sin precio válido
      pedido.items = pedido.items.filter(item => item.precio > 0);

      // Recalcular el total
      pedido.total = pedido.items.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    }

    // Si no quedan ítems, mostrar error
    if (pedido.items.length === 0) {
      throw new Error('No se puede crear un pedido sin ítems con precios válidos');
    }

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
