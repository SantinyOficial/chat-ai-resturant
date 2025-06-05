import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PagoService, MetodoPago, EstadoPagoPedido } from '../../services/pago.service';

@Component({
  selector: 'app-pago-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-cliente.component.html',
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
