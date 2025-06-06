import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { EstadoPagoPedido, EstadoPedido } from '../models/enums';

export interface EstadoSincronizado {
  pedidoId: string;
  estadoPedido: EstadoPedido;
  estadoPago: EstadoPagoPedido;
  fechaActualizacion: Date;
  mensaje?: string;
  mesa?: string | number;
  // Nuevos campos para mejor notificación
  prioridad?: 'alta' | 'media' | 'baja';
  requiereAtencion?: boolean;
  clienteNombre?: string;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class EstadoSincronizacionService {
  private estadosSubject = new BehaviorSubject<EstadoSincronizado[]>([]);
  public estados$ = this.estadosSubject.asObservable();

  // Alias para cambios$ (usado por algunos componentes)
  public cambios$ = this.estados$;

  constructor() {
    console.log('🔄 EstadoSincronizacionService inicializado');
  }

  actualizarEstado(estado: EstadoSincronizado): void {
    const estadosActuales = this.estadosSubject.value;
    const index = estadosActuales.findIndex(e => e.pedidoId === estado.pedidoId);

    // Determinar prioridad automáticamente
    if (!estado.prioridad) {
      estado.prioridad = this.determinarPrioridad(estado);
    }

    // Determinar si requiere atención
    estado.requiereAtencion = this.requiereAtencion(estado);

    if (index >= 0) {
      estadosActuales[index] = { ...estado, fechaActualizacion: new Date() };
    } else {
      estadosActuales.push({ ...estado, fechaActualizacion: new Date() });
    }

    console.log('🔄 Estado actualizado:', estado);
    this.estadosSubject.next([...estadosActuales]);
  }

  actualizarEstadoPago(pedidoId: string, estadoPago: EstadoPagoPedido, metadata?: any): void {
    const estadoActual = this.obtenerEstado(pedidoId);
    const nuevoEstado: EstadoSincronizado = {
      pedidoId,
      estadoPedido: estadoActual?.estadoPedido || EstadoPedido.PENDIENTE,
      estadoPago,
      fechaActualizacion: new Date(),
      mensaje: this.generarMensajePago(estadoPago),
      mesa: metadata?.mesa || estadoActual?.mesa,
      clienteNombre: metadata?.clienteNombre || estadoActual?.clienteNombre,
      total: metadata?.total || estadoActual?.total
    };
    this.actualizarEstado(nuevoEstado);
  }

  actualizarEstadoPedido(pedidoId: string, estadoPedido: EstadoPedido, metadata?: any): void {
    const estadoActual = this.obtenerEstado(pedidoId);
    const nuevoEstado: EstadoSincronizado = {
      pedidoId,
      estadoPedido,
      estadoPago: estadoActual?.estadoPago || EstadoPagoPedido.PENDIENTE_PAGO,
      fechaActualizacion: new Date(),
      mensaje: this.generarMensajePedido(estadoPedido),
      mesa: metadata?.mesa || estadoActual?.mesa,
      clienteNombre: metadata?.clienteNombre || estadoActual?.clienteNombre,
      total: metadata?.total || estadoActual?.total
    };
    this.actualizarEstado(nuevoEstado);
  }

  private determinarPrioridad(estado: EstadoSincronizado): 'alta' | 'media' | 'baja' {
    if (estado.estadoPago === EstadoPagoPedido.PAGO_REALIZADO &&
        estado.estadoPedido === EstadoPedido.PENDIENTE) {
      return 'alta'; // Pago completado, necesita aceptación
    }
    if (estado.estadoPago === EstadoPagoPedido.PAGO_FALLIDO) {
      return 'alta'; // Error de pago, requiere atención
    }
    if (estado.estadoPedido === EstadoPedido.LISTO) {
      return 'media'; // Pedido listo para entregar
    }
    return 'baja';
  }

  private requiereAtencion(estado: EstadoSincronizado): boolean {
    return estado.estadoPago === EstadoPagoPedido.PAGO_REALIZADO &&
           estado.estadoPedido === EstadoPedido.PENDIENTE;
  }

  private generarMensajePago(estadoPago: EstadoPagoPedido): string {
    const mensajes = {
      [EstadoPagoPedido.PENDIENTE_PAGO]: 'Esperando pago del cliente',
      [EstadoPagoPedido.PROCESANDO_PAGO]: 'Procesando pago...',
      [EstadoPagoPedido.PAGO_REALIZADO]: '💰 ¡PAGO COMPLETADO! - Listo para aceptar',
      [EstadoPagoPedido.PAGO_FALLIDO]: '❌ Error en el pago - Requiere atención'
    };
    return mensajes[estadoPago] || `Pago actualizado a ${estadoPago}`;
  }

  private generarMensajePedido(estadoPedido: EstadoPedido): string {
    const mensajes = {
      [EstadoPedido.PENDIENTE]: 'Pedido pendiente de confirmación',
      [EstadoPedido.CONFIRMADO]: 'Pedido confirmado',
      [EstadoPedido.EN_PREPARACION]: '🍳 Pedido en preparación',
      [EstadoPedido.LISTO]: '🍽️ Pedido listo para entregar',
      [EstadoPedido.EN_CAMINO]: '🚗 Pedido en camino',
      [EstadoPedido.ENTREGADO]: '✅ Pedido entregado',
      [EstadoPedido.CANCELADO]: '❌ Pedido cancelado'
    };
    return mensajes[estadoPedido] || `Estado actualizado a ${estadoPedido}`;
  }

  forzarSincronizacion(): Observable<boolean> {
    // Simular sincronización exitosa
    return new Observable(observer => {
      setTimeout(() => {
        observer.next(true);
        observer.complete();
      }, 1000);
    });
  }

  obtenerEstado(pedidoId: string): EstadoSincronizado | null {
    return this.estadosSubject.value.find(e => e.pedidoId === pedidoId) || null;
  }

  obtenerEstados(): EstadoSincronizado[] {
    return this.estadosSubject.value;
  }

  limpiarEstados(): void {
    this.estadosSubject.next([]);
  }

  eliminarEstado(pedidoId: string): void {
    const estadosActuales = this.estadosSubject.value.filter(e => e.pedidoId !== pedidoId);
    this.estadosSubject.next(estadosActuales);
  }
}
