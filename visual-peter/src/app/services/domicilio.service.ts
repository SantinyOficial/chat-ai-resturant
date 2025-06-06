import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum EstadoDomicilio {
  PENDIENTE = 'PENDIENTE',
  ASIGNADO = 'ASIGNADO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO',
  DEVUELTO = 'DEVUELTO'
}

export enum TipoVehiculo {
  MOTO = 'MOTO',
  BICICLETA = 'BICICLETA',
  CARRO = 'CARRO',
  PIE = 'PIE'
}

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Direccion {
  calle: string;
  numero: string;
  barrio: string;
  ciudad: string;
  codigoPostal?: string;
  referencias?: string;
  coordenadas?: Coordenadas;
}

export interface Domiciliario {
  id: string;
  nombre: string;
  telefono: string;
  vehiculo: TipoVehiculo;
  ubicacionActual?: Coordenadas;
  disponible: boolean;
  calificacion?: number;
  pedidosAsignados: number;
}

export interface SeguimientoDomicilio {
  pedidoId: string;
  estado: EstadoDomicilio;
  domiciliario?: Domiciliario;
  ubicacionActual?: Coordenadas;
  tiempoEstimadoEntrega?: string;
  direccionDestino?: Direccion;
  horaEstimadaEntrega?: string;
  observaciones?: string;
  historial: HistorialSeguimiento[];
  
  // Campos adicionales del backend
  nombreDomiciliario?: string;
  telefonoDomiciliario?: string;
  vehiculo?: string;
  ubicacionTexto?: string;
}

export interface HistorialSeguimiento {
  timestamp: string;
  estado: EstadoDomicilio;
  ubicacion?: Coordenadas;
  descripcion: string;
}

export interface ConfiguracionDomicilio {
  distanciaMaxima: number; // en km
  costoBase: number;
  costoPorKm: number;
  tiempoEstimadoPorKm: number; // en minutos
  horarioInicio: string;
  horarioFin: string;
  zonasCovertura: ZonaCobertura[];
}

export interface ZonaCobertura {
  nombre: string;
  poligono: Coordenadas[];
  costoAdicional: number;
  disponible: boolean;
}

export interface PedidoDomicilio {
  id?: string;
  pedidoId: string;
  clienteId: string;
  direccionEntrega: Direccion;
  estado: EstadoDomicilio;
  domiciliarioAsignado?: Domiciliario;
  costoEnvio: number;
  distancia: number; // en km
  tiempoEstimado: number; // en minutos
  fechaCreacion: string;
  fechaAsignacion?: string;
  fechaEntrega?: string;
  observaciones?: string;
  seguimiento: SeguimientoDomicilio;
}

export interface ResultadoDomicilio {
  exitoso: boolean;
  mensaje: string;
  pedido?: any; // Referencia al pedido completo
  costoEnvio?: number;
  tiempoEstimado?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DomicilioService {
  private apiUrl = '/api/domicilios';

  constructor(private http: HttpClient) {}

  // Configurar pedido para domicilio
  configurarPedidoDomicilio(pedido: any, direccion: Direccion): Observable<ResultadoDomicilio> {
    return this.http.post<ResultadoDomicilio>(`${this.apiUrl}/configurar-pedido`, {
      pedido,
      direccion
    });
  }

  // Calcular costo de envío
  calcularCostoEnvio(direccion: Direccion): Observable<{costo: number, distancia: number, tiempoEstimado: number}> {
    return this.http.post<{costo: number, distancia: number, tiempoEstimado: number}>(`${this.apiUrl}/calcular-costo`, direccion);
  }

  // Obtener pedidos a domicilio pendientes
  getPedidosDomicilioPendientes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pedidos-pendientes`);
  }

  // Obtener seguimiento de un pedido
  obtenerSeguimiento(pedidoId: string): Observable<SeguimientoDomicilio> {
    return this.http.get<SeguimientoDomicilio>(`${this.apiUrl}/seguimiento/${pedidoId}`);
  }

  // Asignar domiciliario a un pedido
  asignarDomiciliario(pedidoId: string, domiciliarioId: string): Observable<{success: boolean, mensaje: string}> {
    return this.http.post<{success: boolean, mensaje: string}>(`${this.apiUrl}/asignar-domiciliario`, {
      pedidoId,
      domiciliarioId
    });
  }

  // Actualizar ubicación del domiciliario
  actualizarUbicacionDomiciliario(domiciliarioId: string, coordenadas: Coordenadas): Observable<{success: boolean}> {
    return this.http.put<{success: boolean}>(`${this.apiUrl}/domiciliarios/${domiciliarioId}/ubicacion`, coordenadas);
  }

  // Actualizar estado del domicilio
  actualizarEstadoDomicilio(pedidoId: string, estado: EstadoDomicilio, observaciones?: string): Observable<SeguimientoDomicilio> {
    return this.http.put<SeguimientoDomicilio>(`${this.apiUrl}/pedidos/${pedidoId}/estado`, {
      estado,
      observaciones
    });
  }

  // Obtener domiciliarios disponibles
  getDomiciliariosDisponibles(): Observable<Domiciliario[]> {
    return this.http.get<Domiciliario[]>(`${this.apiUrl}/domiciliarios/disponibles`);
  }

  // Obtener todos los domiciliarios
  getAllDomiciliarios(): Observable<Domiciliario[]> {
    return this.http.get<Domiciliario[]>(`${this.apiUrl}/domiciliarios`);
  }

  // Obtener pedidos asignados a un domiciliario
  getPedidosByDomiciliario(domiciliarioId: string): Observable<PedidoDomicilio[]> {
    return this.http.get<PedidoDomicilio[]>(`${this.apiUrl}/domiciliarios/${domiciliarioId}/pedidos`);
  }

  // Obtener configuración de domicilios
  getConfiguracion(): Observable<ConfiguracionDomicilio> {
    return this.http.get<ConfiguracionDomicilio>(`${this.apiUrl}/configuracion`);
  }

  // Actualizar configuración de domicilios
  actualizarConfiguracion(config: ConfiguracionDomicilio): Observable<ConfiguracionDomicilio> {
    return this.http.put<ConfiguracionDomicilio>(`${this.apiUrl}/configuracion`, config);
  }

  // Verificar si una dirección está en zona de cobertura
  verificarZonaCobertura(direccion: Direccion): Observable<{cubierto: boolean, zona?: string, costoAdicional?: number}> {
    return this.http.post<{cubierto: boolean, zona?: string, costoAdicional?: number}>(`${this.apiUrl}/verificar-cobertura`, direccion);
  }

  // Obtener zonas de cobertura
  getZonasCobertura(): Observable<ZonaCobertura[]> {
    return this.http.get<ZonaCobertura[]>(`${this.apiUrl}/zonas-cobertura`);
  }

  // Obtener estadísticas de domicilios
  getEstadisticasDomicilios(): Observable<{
    pedidosEnCamino: number,
    pedidosEntregados: number,
    tiempoPromedioEntrega: number,
    domiciliariosActivos: number,
    ingresosTotales: number
  }> {
    return this.http.get<{
      pedidosEnCamino: number,
      pedidosEntregados: number,
      tiempoPromedioEntrega: number,
      domiciliariosActivos: number,
      ingresosTotales: number
    }>(`${this.apiUrl}/estadisticas`);
  }

  // Optimizar rutas para domiciliarios
  optimizarRutas(domiciliarioId: string): Observable<{ruta: Coordenadas[], tiempoEstimado: number, distanciaTotal: number}> {
    return this.http.post<{ruta: Coordenadas[], tiempoEstimado: number, distanciaTotal: number}>(`${this.apiUrl}/optimizar-rutas`, {
      domiciliarioId
    });
  }

  // Notificar cliente sobre estado del pedido
  notificarCliente(pedidoId: string, mensaje: string): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.apiUrl}/notificar-cliente`, {
      pedidoId,
      mensaje
    });
  }

  // Marcar pedido como entregado
  marcarPedidoEntregado(pedidoId: string, observaciones?: string): Observable<SeguimientoDomicilio> {
    return this.http.post<SeguimientoDomicilio>(`${this.apiUrl}/pedidos/${pedidoId}/entregar`, {
      observaciones
    });
  }

  // Reportar problema en la entrega
  reportarProblema(pedidoId: string, problema: string, solucion?: string): Observable<{success: boolean, mensaje: string}> {
    return this.http.post<{success: boolean, mensaje: string}>(`${this.apiUrl}/pedidos/${pedidoId}/problema`, {
      problema,
      solucion
    });
  }

  // Obtener historial de entregas de un cliente
  getHistorialEntregas(clienteId: string): Observable<PedidoDomicilio[]> {
    return this.http.get<PedidoDomicilio[]>(`${this.apiUrl}/historial-cliente/${clienteId}`);
  }

  // Calificar domiciliario
  calificarDomiciliario(domiciliarioId: string, pedidoId: string, calificacion: number, comentario?: string): Observable<{success: boolean}> {
    return this.http.post<{success: boolean}>(`${this.apiUrl}/calificar-domiciliario`, {
      domiciliarioId,
      pedidoId,
      calificacion,
      comentario
    });
  }

  // Cancelar domicilio
  cancelarDomicilio(pedidoId: string, motivo: string): Observable<{success: boolean, mensaje: string}> {
    return this.http.post<{success: boolean, mensaje: string}>(`${this.apiUrl}/pedidos/${pedidoId}/cancelar`, {
      motivo
    });
  }

  // Solicitar domiciliario de emergencia
  solicitarDomiciliarioEmergencia(pedidoId: string): Observable<{success: boolean, domiciliario?: Domiciliario}> {
    return this.http.post<{success: boolean, domiciliario?: Domiciliario}>(`${this.apiUrl}/emergencia/${pedidoId}`, {});
  }
}
