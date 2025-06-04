import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TARJETA_CREDITO = 'TARJETA_CREDITO',
  TARJETA_DEBITO = 'TARJETA_DEBITO',
  NEQUI = 'NEQUI',
  PSE = 'PSE',
  DAVIPLATA = 'DAVIPLATA'
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  CANCELADO = 'CANCELADO',
  REEMBOLSADO = 'REEMBOLSADO'
}

export interface DatosTarjeta {
  numeroTarjeta: string;
  nombreTarjeta: string;
  mesExpiracion: number;
  anoExpiracion: number;
  cvv: string;
}

export interface DatosNequi {
  telefono: string;
  codigoVerificacion?: string;
}

export interface DatosPSE {
  banco: string;
  tipoDocumento: string;
  numeroDocumento: string;
  email: string;
}

export interface DatosDaviplata {
  telefono: string;
  pin?: string;
}

export interface Pago {
  id?: string;
  pedidoId: string;
  clienteId: string;
  metodoPago: MetodoPago;
  monto: number;
  estado: EstadoPago;
  fechaCreacion?: string;
  fechaProcesamiento?: string;
  descripcion?: string;
  observaciones?: string;
  codigoTransaccion?: string;
  
  // Datos específicos del método de pago
  numeroTarjeta?: string;
  nombreTarjeta?: string;
  mesExpiracion?: number;
  anoExpiracion?: number;
  cvv?: string;
  telefonoNequi?: string;
  bancoPSE?: string;
  tipoDocumentoPSE?: string;
  numeroDocumentoPSE?: string;
  emailPSE?: string;
  telefonoDaviplata?: string;
  pinDaviplata?: string;
  
  // Información adicional
  comisionBanco?: number;
  montoTotal?: number;
  referenciaPago?: string;
  urlComprobante?: string;
}

export interface MetodoPagoDisponible {
  metodo: MetodoPago;
  nombre: string;
  descripcion: string;
  comision: number;
  montoMinimo: number;
  montoMaximo: number;
  disponible: boolean;
  icono?: string;
}

export interface ResultadoPago {
  success: boolean;
  pago?: Pago;
  mensaje: string;
  codigoTransaccion?: string;
  urlComprobante?: string;
  qrCode?: string; // Para pagos digitales
}

export interface CodigoQR {
  codigo: string;
  imagen: string; // Base64
  validoHasta: string;
  monto: number;
  referencia: string;
}

@Injectable({
  providedIn: 'root'
})
export class PagoService {
  private apiUrl = '/api/pagos';

  constructor(private http: HttpClient) {}

  // Obtener métodos de pago disponibles
  getMetodosPagoDisponibles(): Observable<MetodoPagoDisponible[]> {
    return this.http.get<MetodoPagoDisponible[]>(`${this.apiUrl}/metodos-disponibles`);
  }

  // Procesar pago
  procesarPago(pago: Pago): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar`, pago);
  }

  // Procesar pago con tarjeta
  procesarPagoTarjeta(pedidoId: string, monto: number, datosTarjeta: DatosTarjeta): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: datosTarjeta.numeroTarjeta.startsWith('4') ? MetodoPago.TARJETA_CREDITO : MetodoPago.TARJETA_DEBITO,
      numeroTarjeta: datosTarjeta.numeroTarjeta,
      nombreTarjeta: datosTarjeta.nombreTarjeta,
      mesExpiracion: datosTarjeta.mesExpiracion,
      anoExpiracion: datosTarjeta.anoExpiracion,
      cvv: datosTarjeta.cvv
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-tarjeta`, pago);
  }

  // Procesar pago con Nequi
  procesarPagoNequi(pedidoId: string, monto: number, datosNequi: DatosNequi): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.NEQUI,
      telefonoNequi: datosNequi.telefono
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-nequi`, pago);
  }

  // Procesar pago con PSE
  procesarPagoPSE(pedidoId: string, monto: number, datosPSE: DatosPSE): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.PSE,
      bancoPSE: datosPSE.banco,
      tipoDocumentoPSE: datosPSE.tipoDocumento,
      numeroDocumentoPSE: datosPSE.numeroDocumento,
      emailPSE: datosPSE.email
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-pse`, pago);
  }

  // Procesar pago con Daviplata
  procesarPagoDaviplata(pedidoId: string, monto: number, datosDaviplata: DatosDaviplata): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.DAVIPLATA,
      telefonoDaviplata: datosDaviplata.telefono,
      pinDaviplata: datosDaviplata.pin
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-daviplata`, pago);
  }

  // Procesar pago en efectivo
  procesarPagoEfectivo(pedidoId: string, monto: number, observaciones?: string): Observable<ResultadoPago> {
    const pago: Partial<Pago> = {
      pedidoId,
      monto,
      metodoPago: MetodoPago.EFECTIVO,
      observaciones
    };
    return this.http.post<ResultadoPago>(`${this.apiUrl}/procesar-efectivo`, pago);
  }

  // Generar código QR para pago
  generarCodigoQR(pedidoId: string, metodoPago: MetodoPago): Observable<CodigoQR> {
    return this.http.post<CodigoQR>(`${this.apiUrl}/generar-qr`, {
      pedidoId,
      metodoPago
    });
  }

  // Verificar estado de pago
  verificarEstadoPago(pagoId: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${pagoId}/estado`);
  }

  // Obtener pago por ID
  getPagoById(pagoId: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/${pagoId}`);
  }

  // Obtener pagos por pedido
  getPagosByPedido(pedidoId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/pedido/${pedidoId}`);
  }

  // Obtener pagos por cliente
  getPagosByCliente(clienteId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/cliente/${clienteId}`);
  }

  // Obtener historial de pagos
  getHistorialPagos(clienteId: string): Observable<Pago[]> {
    return this.http.get<Pago[]>(`${this.apiUrl}/historial/${clienteId}`);
  }

  // Cancelar pago
  cancelarPago(pagoId: string, motivo?: string): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/${pagoId}/cancelar`, {
      motivo
    });
  }

  // Procesar reembolso
  procesarReembolso(pagoId: string, monto?: number, motivo?: string): Observable<ResultadoPago> {
    return this.http.post<ResultadoPago>(`${this.apiUrl}/${pagoId}/reembolso`, {
      monto,
      motivo
    });
  }

  // Validar datos de tarjeta
  validarDatosTarjeta(datosTarjeta: DatosTarjeta): Observable<{valido: boolean, errores?: string[]}> {
    return this.http.post<{valido: boolean, errores?: string[]}>(`${this.apiUrl}/validar-tarjeta`, datosTarjeta);
  }

  // Validar número de teléfono para Nequi/Daviplata
  validarTelefono(telefono: string, metodo: MetodoPago): Observable<{valido: boolean, mensaje?: string}> {
    return this.http.post<{valido: boolean, mensaje?: string}>(`${this.apiUrl}/validar-telefono`, {
      telefono,
      metodo
    });
  }

  // Obtener bancos disponibles para PSE
  getBancosDisponibles(): Observable<{codigo: string, nombre: string}[]> {
    return this.http.get<{codigo: string, nombre: string}[]>(`${this.apiUrl}/bancos-pse`);
  }

  // Consultar comisión por método de pago
  consultarComision(metodoPago: MetodoPago, monto: number): Observable<{comision: number, total: number}> {
    return this.http.get<{comision: number, total: number}>(`${this.apiUrl}/comision`, {
      params: {
        metodoPago: metodoPago.toString(),
        monto: monto.toString()
      }
    });
  }

  // Consultar pago por código de transacción
  consultarPago(codigoTransaccion: string): Observable<Pago> {
    return this.http.get<Pago>(`${this.apiUrl}/consultar/${codigoTransaccion}`);
  }

  // Descargar comprobante de pago
  descargarComprobante(pagoId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${pagoId}/comprobante`, {
      responseType: 'blob'
    });
  }
}
