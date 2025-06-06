import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum EstadoCocina {
  RECIBIDO = 'RECIBIDO',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO = 'LISTO',
  ENTREGADO = 'ENTREGADO',
  PAUSADO = 'PAUSADO',
  CANCELADO = 'CANCELADO'
}

export enum PrioridadPedido {
  NORMAL = 'NORMAL',
  ALTA = 'ALTA',
  URGENTE = 'URGENTE'
}

export interface ItemCocina {
  nombre: string;
  cantidad: number;
  estado: EstadoCocina;
  observaciones?: string;
  tiempoEstimado?: number; // en minutos
  estacion?: string; // estación de cocina asignada
}

export interface PedidoCocina {
  id: string;
  numeroPedido?: number;
  clienteNombre: string;
  mesa: number;
  items: ItemCocina[];
  estado: EstadoCocina;
  prioridad: PrioridadPedido;
  fechaRecibido: string;
  fechaIniciado?: string;
  fechaCompleto?: string;
  tiempoEstimadoTotal?: number; // en minutos
  cocineroAsignado?: string;
  observaciones?: string;
}

export interface EstadisticasCocina {
  pedidosPendientes: number;
  pedidosEnPreparacion: number;
  pedidosListos: number;
  tiempoPromedioPreparacion: number; // en minutos
  pedidosCompletadosHoy: number;
  eficienciaCocina: number; // porcentaje
}

export interface CocineroAsignado {
  id: string;
  nombre: string;
  especialidad?: string;
  pedidosAsignados: number;
  disponible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CocinaService {
  private apiUrl = '/api/cocina';

  constructor(private http: HttpClient) {}

  // Obtener todos los pedidos en cocina
  getPedidosCocina(): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos`);
  }
  // Obtener pedidos pendientes y en preparación
  getPedidosPendientes(): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos-pendientes`);
  }

  // Obtener pedidos por estado específico
  getPedidosPorEstado(estado: string): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos-por-estado/${estado}`);
  }

  // Obtener todos los pedidos activos
  getPedidosActivos(): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos-activos`);
  }

  // Obtener pedidos en preparación
  getPedidosEnPreparacion(): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos/en-preparacion`);
  }

  // Obtener pedidos listos
  getPedidosListos(): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/pedidos/listos`);
  }

  // Obtener un pedido específico
  getPedidoById(id: string): Observable<PedidoCocina> {
    return this.http.get<PedidoCocina>(`${this.apiUrl}/pedidos/${id}`);
  }

  // Iniciar preparación de un pedido
  iniciarPreparacion(pedidoId: string, cocineroId?: string): Observable<PedidoCocina> {
    const body = cocineroId ? { cocineroId } : {};
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/iniciar`, body);
  }

  // Marcar pedido como listo
  marcarPedidoListo(pedidoId: string): Observable<PedidoCocina> {
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/listo`, {});
  }

  // Marcar pedido como entregado
  marcarPedidoEntregado(pedidoId: string): Observable<PedidoCocina> {
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/entregado`, {});
  }

  // Pausar preparación de un pedido
  pausarPedido(pedidoId: string, motivo?: string): Observable<PedidoCocina> {
    const body = motivo ? { motivo } : {};
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/pausar`, body);
  }

  // Reanudar preparación de un pedido
  reanudarPedido(pedidoId: string): Observable<PedidoCocina> {
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/reanudar`, {});
  }

  // Cancelar pedido
  cancelarPedido(pedidoId: string, motivo?: string): Observable<PedidoCocina> {
    const body = motivo ? { motivo } : {};
    return this.http.post<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/cancelar`, body);
  }

  // Actualizar estado de un ítem específico
  actualizarEstadoItem(pedidoId: string, itemNombre: string, estado: EstadoCocina): Observable<PedidoCocina> {
    return this.http.put<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/items/${itemNombre}/estado`, {
      estado
    });
  }

  // Cambiar prioridad de un pedido
  cambiarPrioridad(pedidoId: string, prioridad: PrioridadPedido): Observable<PedidoCocina> {
    return this.http.put<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/prioridad`, {
      prioridad
    });
  }

  // Asignar cocinero a un pedido
  asignarCocinero(pedidoId: string, cocineroId: string): Observable<PedidoCocina> {
    return this.http.put<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/asignar-cocinero`, {
      cocineroId
    });
  }

  // Actualizar observaciones del pedido
  actualizarObservaciones(pedidoId: string, observaciones: string): Observable<PedidoCocina> {
    return this.http.put<PedidoCocina>(`${this.apiUrl}/pedidos/${pedidoId}/observaciones`, {
      observaciones
    });
  }

  // Obtener estadísticas de la cocina
  getEstadisticas(): Observable<EstadisticasCocina> {
    return this.http.get<EstadisticasCocina>(`${this.apiUrl}/estadisticas`);
  }

  // Obtener cocineros disponibles
  getCocinerosDisponibles(): Observable<CocineroAsignado[]> {
    return this.http.get<CocineroAsignado[]>(`${this.apiUrl}/cocineros`);
  }

  // Obtener pedidos asignados a un cocinero
  getPedidosPorCocinero(cocineroId: string): Observable<PedidoCocina[]> {
    return this.http.get<PedidoCocina[]>(`${this.apiUrl}/cocineros/${cocineroId}/pedidos`);
  }

  // Calcular tiempo estimado para un nuevo pedido
  calcularTiempoEstimado(items: any[]): Observable<{tiempoMinutos: number}> {
    return this.http.post<{tiempoMinutos: number}>(`${this.apiUrl}/calcular-tiempo`, {
      items
    });
  }

  // Obtener historial de un pedido
  getHistorialPedido(pedidoId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pedidos/${pedidoId}/historial`);
  }

  // Notificar que un pedido está listo
  notificarPedidoListo(pedidoId: string): Observable<{success: boolean, mensaje: string}> {
    return this.http.post<{success: boolean, mensaje: string}>(`${this.apiUrl}/pedidos/${pedidoId}/notificar`, {});
  }

  // === COMANDOS DE VOZ ===

  // Procesar comando de voz
  procesarComandoVoz(comando: string): Observable<{success: boolean, mensaje: string, pedido?: any}> {
    return this.http.post<{success: boolean, mensaje: string, pedido?: any}>(`${this.apiUrl}/comando-voz`, {
      comando
    });
  }

  // Obtener comandos sugeridos
  getComandosSugeridos(): Observable<{comandos: string[], patrones: any, ejemplos: string[]}> {
    return this.http.get<{comandos: string[], patrones: any, ejemplos: string[]}>(`${this.apiUrl}/comandos-sugeridos`);
  }

  // Obtener estado del reconocimiento de voz
  getEstadoReconocimiento(): Observable<{disponible: boolean, idioma: string, precision: number, estado: string, mensaje: string}> {
    return this.http.get<{disponible: boolean, idioma: string, precision: number, estado: string, mensaje: string}>(`${this.apiUrl}/estado-reconocimiento`);
  }

  // Controlar reconocimiento de voz
  controlarReconocimiento(iniciar: boolean): Observable<{success: boolean, estado: string, mensaje: string, timestamp: number}> {
    return this.http.post<{success: boolean, estado: string, mensaje: string, timestamp: number}>(`${this.apiUrl}/reconocimiento`, {
      iniciar
    });
  }

  // Obtener configuración de la cocina
  getConfiguracionCocina(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/configuracion`);
  }
}
