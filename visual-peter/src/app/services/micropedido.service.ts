import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum TipoMicropedido {
  BEBIDA = 'BEBIDA',
  SNACK = 'SNACK',
  POSTRE = 'POSTRE',
  ACOMPANAMIENTO = 'ACOMPANAMIENTO'
}

export enum EstadoMicropedido {
  PENDIENTE = 'PENDIENTE',
  PREPARANDO = 'PREPARANDO',
  LISTO = 'LISTO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO'
}

export interface ItemMicropedido {
  nombre: string;
  tipo: TipoMicropedido;
  precio: number;
  cantidad: number;
  observaciones?: string;
}

export interface Micropedido {
  id?: string;
  clienteId: string;
  clienteNombre?: string;
  mesa: number;
  items: ItemMicropedido[];
  total: number;
  estado: EstadoMicropedido;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  tiempoEstimado?: number; // en minutos
  observaciones?: string;
}

export interface OpcionMicropedido {
  nombre: string;
  tipo: TipoMicropedido;
  precio: number;
  disponible: boolean;
  descripcion?: string;
  tiempoPreparacion?: number; // en minutos
}

@Injectable({
  providedIn: 'root'
})
export class MicropedidoService {
  private apiUrl = '/api/micropedidos';

  constructor(private http: HttpClient) {}

  // ===== MÉTODOS PARA MVP - SIMULACIÓN LOCAL =====

  // Obtener opciones cuando la API no está disponible
  getOpcionesSimuladas(): Observable<OpcionMicropedido[]> {
    return new Observable(observer => {
      const opcionesSimuladas: OpcionMicropedido[] = [
        {
          nombre: 'Café Americano',
          tipo: TipoMicropedido.BEBIDA,
          precio: 3500,
          disponible: true,
          descripcion: 'Café negro tradicional',
          tiempoPreparacion: 3
        },
        {
          nombre: 'Café Latte',
          tipo: TipoMicropedido.BEBIDA,
          precio: 4500,
          disponible: true,
          descripcion: 'Café con leche espumosa',
          tiempoPreparacion: 5
        },
        {
          nombre: 'Agua Mineral',
          tipo: TipoMicropedido.BEBIDA,
          precio: 2500,
          disponible: true,
          descripcion: 'Agua mineral con o sin gas',
          tiempoPreparacion: 1
        },
        {
          nombre: 'Jugo Natural',
          tipo: TipoMicropedido.BEBIDA,
          precio: 5000,
          disponible: true,
          descripcion: 'Jugo natural del día',
          tiempoPreparacion: 7
        },
        {
          nombre: 'Galletas de Chocolate',
          tipo: TipoMicropedido.SNACK,
          precio: 3000,
          disponible: true,
          descripcion: 'Porción de galletas de chocolate',
          tiempoPreparacion: 0
        },
        {
          nombre: 'Chips de Plátano',
          tipo: TipoMicropedido.SNACK,
          precio: 3500,
          disponible: true,
          descripcion: 'Plátano maduro frito en chips',
          tiempoPreparacion: 8
        },
        {
          nombre: 'Postre del Día',
          tipo: TipoMicropedido.POSTRE,
          precio: 6000,
          disponible: true,
          descripcion: 'Postre especial del chef',
          tiempoPreparacion: 0
        },
        {
          nombre: 'Guarnición Extra',
          tipo: TipoMicropedido.ACOMPANAMIENTO,
          precio: 4000,
          disponible: true,
          descripcion: 'Porción adicional de acompañamiento',
          tiempoPreparacion: 5
        }
      ];
      observer.next(opcionesSimuladas);
      observer.complete();
    });
  }

  // Versión resiliente que intenta la API y si falla, usa datos simulados
  getOpcionesDisponibles(): Observable<OpcionMicropedido[]> {
    return new Observable(observer => {
      this.http.get<OpcionMicropedido[]>(`${this.apiUrl}/opciones`)
        .subscribe({
          next: (opciones) => {
            observer.next(opciones);
            observer.complete();
          },
          error: (err) => {
            console.warn('Error al obtener opciones de micropedidos desde la API. Usando datos simulados', err);
            this.getOpcionesSimuladas().subscribe({
              next: (opcionesSimuladas) => {
                observer.next(opcionesSimuladas);
                observer.complete();
              }
            });
          }
        });
    });
  }

  // ===== MÉTODOS DE API =====

  // Obtener opciones por tipo
  getOpcionesPorTipo(tipo: TipoMicropedido): Observable<OpcionMicropedido[]> {
    return this.http.get<OpcionMicropedido[]>(`${this.apiUrl}/opciones/tipo/${tipo}`);
  }

  // Crear un nuevo micropedido
  crearMicropedido(micropedido: Micropedido): Observable<Micropedido> {
    return this.http.post<Micropedido>(this.apiUrl, micropedido);
  }

  // Obtener todos los micropedidos
  getAllMicropedidos(): Observable<Micropedido[]> {
    return this.http.get<Micropedido[]>(this.apiUrl);
  }

  // Obtener micropedido por ID
  getMicropedidoById(id: string): Observable<Micropedido> {
    return this.http.get<Micropedido>(`${this.apiUrl}/${id}`);
  }

  // Obtener micropedidos por cliente
  getMicropedidosByCliente(clienteId: string): Observable<Micropedido[]> {
    return this.http.get<Micropedido[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Obtener micropedidos por estado
  getMicropedidosByEstado(estado: EstadoMicropedido): Observable<Micropedido[]> {
    return this.http.get<Micropedido[]>(`${this.apiUrl}/estado/${estado}`);
  }

  // Obtener micropedidos por mesa
  getMicropedidosByMesa(mesa: number): Observable<Micropedido[]> {
    return this.http.get<Micropedido[]>(`${this.apiUrl}/mesa/${mesa}`);
  }

  // Obtener micropedidos activos por cliente
  getMicropedidosActivosByCliente(clienteId: string): Observable<Micropedido[]> {
    return this.http.get<Micropedido[]>(`${this.apiUrl}/cliente/${clienteId}/activos`);
  }

  // Actualizar estado del micropedido
  actualizarEstado(id: string, estado: EstadoMicropedido): Observable<Micropedido> {
    return this.http.put<Micropedido>(`${this.apiUrl}/${id}/estado`, null, {
      params: { estado: estado.toString() }
    });
  }

  // Cancelar micropedido
  cancelarMicropedido(id: string): Observable<Micropedido> {
    return this.http.put<Micropedido>(`${this.apiUrl}/${id}/cancelar`, null);
  }

  // Actualizar micropedido
  actualizarMicropedido(id: string, micropedido: Micropedido): Observable<Micropedido> {
    return this.http.put<Micropedido>(`${this.apiUrl}/${id}`, micropedido);
  }

  // Eliminar micropedido
  eliminarMicropedido(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Calcular tiempo estimado de preparación
  calcularTiempoEstimado(items: ItemMicropedido[]): Observable<{tiempoMinutos: number}> {
    return this.http.post<{tiempoMinutos: number}>(`${this.apiUrl}/calcular-tiempo`, items);
  }

  // Verificar disponibilidad de un ítem
  verificarDisponibilidad(nombre: string): Observable<{disponible: boolean, mensaje?: string}> {
    return this.http.get<{disponible: boolean, mensaje?: string}>(`${this.apiUrl}/disponibilidad/${nombre}`);
  }
}
