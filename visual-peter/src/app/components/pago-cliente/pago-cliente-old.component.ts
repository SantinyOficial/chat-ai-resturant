import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoService, MetodoPago, EstadoPagoPedido } from '../../services/pago.service';

@Component({
  selector: 'app-pago-cliente',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pago-container" [ngClass]="'estado-' + estadoPago">
      <div class="pago-info">
        <h3>{{ getTituloEstado() }}</h3>
        <p class="monto">Total a pagar: <strong>\${{ monto | number:'1.0-0' }}</strong></p>
      </div>

      <!-- Pendiente por pagar -->
      <div *ngIf="estadoPago === 'PENDIENTE_PAGO'" class="pago-pendiente">
        <div class="metodos-pago">
          <button class="metodo-btn"
                  *ngFor="let metodo of metodosDisponibles"
                  [class.selected]="metodoSeleccionado === metodo.value"
                  (click)="seleccionarMetodo(metodo.value)">
            <i class="material-icons">{{ metodo.icon }}</i>
            <span>{{ metodo.label }}</span>
          </button>
        </div>
        <button class="btn-pagar"
                [disabled]="!metodoSeleccionado"
                (click)="procesarPago()">
          <i class="material-icons">payment</i>
          Pagar Ahora
        </button>
      </div>

      <!-- Procesando pago -->
      <div *ngIf="estadoPago === 'PROCESANDO_PAGO'" class="pago-procesando">
        <div class="loading-animation">
          <div class="spinner"></div>
        </div>
        <p>Procesando tu pago...</p>
        <p class="metodo-info">{{ getMetodoLabel(metodoSeleccionado) }}</p>
        <div class="progress-text">
          <small>Este proceso puede tardar unos segundos</small>
        </div>
      </div>

      <!-- Pago realizado -->
      <div *ngIf="estadoPago === 'PAGO_REALIZADO'" class="pago-exitoso">
        <div class="success-icon">
          <i class="material-icons">check_circle</i>
        </div>
        <p><strong>¡Pago realizado exitosamente!</strong></p>
        <p class="info">Tu pedido está siendo confirmado por nuestro equipo.</p>
        <div class="pago-detalles" *ngIf="ultimoPago">
          <p><small>Código de transacción: {{ ultimoPago.codigoTransaccion }}</small></p>
        </div>
      </div>

      <!-- Pago fallido -->
      <div *ngIf="estadoPago === 'PAGO_FALLIDO'" class="pago-fallido">
        <div class="error-icon">
          <i class="material-icons">error</i>
        </div>
        <p><strong>No se pudo procesar el pago</strong></p>
        <p class="error-info">Por favor verifica tus datos e intenta nuevamente</p>
        <button class="btn-reintentar" (click)="reintentar()">
          <i class="material-icons">refresh</i>
          Intentar nuevamente
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./pago-cliente.component.scss']
})
export class PagoClienteComponent {
  @Input() pedidoId!: string;
  @Input() monto!: number;
  @Input() estadoPago: EstadoPagoPedido = EstadoPagoPedido.PENDIENTE_PAGO;
  @Output() pagoCompletado = new EventEmitter<{pedidoId: string, exitoso: boolean, pago?: any}>();

  metodoSeleccionado: MetodoPago | null = null;
  ultimoPago: any = null;

  metodosDisponibles = [
    { value: MetodoPago.TARJETA_CREDITO, label: 'Tarjeta de Crédito', icon: 'credit_card' },
    { value: MetodoPago.NEQUI, label: 'Nequi', icon: 'phone_android' },
    { value: MetodoPago.PSE, label: 'PSE', icon: 'account_balance' },
    { value: MetodoPago.EFECTIVO, label: 'Efectivo', icon: 'payments' },
    { value: MetodoPago.DAVIPLATA, label: 'Daviplata', icon: 'smartphone' }
  ];

  constructor(private pagoService: PagoService) {}

  seleccionarMetodo(metodo: MetodoPago) {
    this.metodoSeleccionado = metodo;
  }

  procesarPago() {
    if (!this.metodoSeleccionado) return;

    this.estadoPago = EstadoPagoPedido.PROCESANDO_PAGO;

    this.pagoService.simularPagoPedido(this.pedidoId, this.monto, this.metodoSeleccionado)
      .subscribe({
        next: (resultado) => {
          if (resultado.success) {
            this.estadoPago = EstadoPagoPedido.PAGO_REALIZADO;
            this.ultimoPago = resultado.pago;
            this.pagoCompletado.emit({
              pedidoId: this.pedidoId,
              exitoso: true,
              pago: resultado.pago
            });
          } else {
            this.estadoPago = EstadoPagoPedido.PAGO_FALLIDO;
            this.pagoCompletado.emit({
              pedidoId: this.pedidoId,
              exitoso: false
            });
          }
        },
        error: () => {
          this.estadoPago = EstadoPagoPedido.PAGO_FALLIDO;
          this.pagoCompletado.emit({
            pedidoId: this.pedidoId,
            exitoso: false
          });
        }
      });
  }

  reintentar() {
    this.estadoPago = EstadoPagoPedido.PENDIENTE_PAGO;
    this.metodoSeleccionado = null;
    this.ultimoPago = null;
  }

  getTituloEstado(): string {
    const titulos = {
      [EstadoPagoPedido.PENDIENTE_PAGO]: 'Realizar Pago',
      [EstadoPagoPedido.PROCESANDO_PAGO]: 'Procesando Pago',
      [EstadoPagoPedido.PAGO_REALIZADO]: 'Pago Completado',
      [EstadoPagoPedido.PAGO_FALLIDO]: 'Error en el Pago'
    };
    return titulos[this.estadoPago] || 'Estado Desconocido';
  }

  getMetodoLabel(metodo: MetodoPago | null): string {
    if (!metodo) return '';
    const metodoInfo = this.metodosDisponibles.find(m => m.value === metodo);
    return metodoInfo?.label || metodo;
  }
}
