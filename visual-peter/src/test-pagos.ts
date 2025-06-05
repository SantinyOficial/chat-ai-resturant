/**
 * Este archivo proporciona funciones de prueba para el flujo de pagos MVP
 * para simular y validar el funcionamiento del flujo completo.
 */

// Importar tipos necesarios desde los servicios del proyecto
import { EstadoPagoPedido, MetodoPago } from './app/services/pago.service';
import { EstadoPedido } from './app/services/pedido.service';

/**
 * Crea un pedido de prueba en localStorage
 */
export function crearPedidoPrueba() {
  // Generar ID aleatorio para el pedido
  const pedidoId = `PED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Crear objeto de pedido
  const pedido = {
    id: pedidoId,
    clienteId: 'cliente-prueba',
    clienteNombre: 'Cliente de Prueba',
    mesa: Math.floor(Math.random() * 10) + 1, // Mesa aleatoria entre 1 y 10
    items: [
      {
        id: 'item1',
        nombre: 'Hamburguesa Deluxe',
        cantidad: 1,
        precio: 25000,
        observaciones: 'Sin cebolla'
      },
      {
        id: 'item2',
        nombre: 'Papas Fritas',
        cantidad: 1,
        precio: 8000,
        observaciones: ''
      },
      {
        id: 'item3',
        nombre: 'Refresco Cola',
        cantidad: 2,
        precio: 5000,
        observaciones: 'Con hielo'
      }
    ],
    estado: EstadoPedido.PENDIENTE,
    estadoPago: EstadoPagoPedido.PENDIENTE_PAGO,
    total: 43000, // 25000 + 8000 + (5000 * 2)
    fechaCreacion: new Date().toISOString(),
    observaciones: 'Pedido de prueba para flujo de pagos'
  };

  // Guardar en localStorage
  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  pedidos.push(pedido);
  localStorage.setItem('pedidos', JSON.stringify(pedidos));

  console.log('✅ Pedido de prueba creado:', pedido);
  return pedido;
}

/**
 * Simula el proceso de pago para un pedido
 */
export function simularProcesoPago(pedidoId: string, metodo: MetodoPago = MetodoPago.TARJETA_CREDITO, exito: boolean = true) {
  console.log(`🔄 Simulando pago para pedido ${pedidoId} con método ${metodo}...`);

  // 1. Actualizar estado a PROCESANDO_PAGO
  actualizarEstadoPedido(pedidoId, EstadoPagoPedido.PROCESANDO_PAGO);

  // 2. Simular delay de procesamiento (2 segundos)
  setTimeout(() => {
    if (exito) {
      // Pago exitoso
      const pago = {
        id: `PAG-${Date.now()}`,
        pedidoId: pedidoId,
        clienteId: 'cliente-prueba',
        metodoPago: metodo,
        monto: obtenerMontoPedido(pedidoId),
        estado: 'APROBADO',
        fechaCreacion: new Date().toISOString(),
        fechaProcesamiento: new Date().toISOString(),
        codigoTransaccion: `TXN-${Math.floor(Math.random() * 1000000)}`
      };

      // Guardar pago en localStorage
      const pagos = JSON.parse(localStorage.getItem('pagos_mvp') || '[]');
      pagos.push(pago);
      localStorage.setItem('pagos_mvp', JSON.stringify(pagos));

      // Actualizar estado de pedido
      actualizarEstadoPedido(pedidoId, EstadoPagoPedido.PAGO_REALIZADO);
      console.log('✅ Pago simulado exitosamente:', pago);
    } else {
      // Pago fallido
      actualizarEstadoPedido(pedidoId, EstadoPagoPedido.PAGO_FALLIDO);
      console.log('❌ Simulación de pago fallido para pedido:', pedidoId);
    }
  }, 2000);
}

/**
 * Actualiza el estado de pago de un pedido
 */
function actualizarEstadoPedido(pedidoId: string, estadoPago: EstadoPagoPedido): void {
  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  const pedidoIndex = pedidos.findIndex((p: any) => p.id === pedidoId);

  if (pedidoIndex !== -1) {
    pedidos[pedidoIndex].estadoPago = estadoPago;
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
    console.log(`🔄 Estado de pago actualizado: ${pedidoId} -> ${estadoPago}`);
  } else {
    console.error(`❌ No se encontró el pedido con ID: ${pedidoId}`);
  }
}

/**
 * Obtiene el monto de un pedido
 */
function obtenerMontoPedido(pedidoId: string): number {
  const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
  const pedido = pedidos.find((p: any) => p.id === pedidoId);

  if (pedido) {
    return pedido.total;
  } else {
    console.error(`❌ No se encontró el pedido con ID: ${pedidoId}`);
    return 0;
  }
}

/**
 * Función principal para probar el flujo completo
 */
export function probarFlujoPagos(): void {
  console.log('🚀 Iniciando prueba del flujo de pagos MVP...');

  // 1. Crear pedido
  const pedido = crearPedidoPrueba();

  // 2. Simular pago exitoso después de un breve delay
  setTimeout(() => {
    simularProcesoPago(pedido.id!, MetodoPago.TARJETA_CREDITO, true);

    // 3. Mostrar resultados después de completar el flujo
    setTimeout(() => {
      const pedidosActualizados = JSON.parse(localStorage.getItem('pedidos') || '[]');
      const pedidoActualizado = pedidosActualizados.find((p: any) => p.id === pedido.id);

      console.log('🔍 Estado final del pedido:', pedidoActualizado);
      console.log('🔍 Pagos realizados:', JSON.parse(localStorage.getItem('pagos_mvp') || '[]'));
      console.log('✅ Prueba de flujo de pagos completada');
    }, 3000);
  }, 1000);
}

// Exponer funciones para uso en consola del navegador
(window as any).testPagos = {
  crearPedidoPrueba,
  simularProcesoPago,
  probarFlujoPagos
};

console.log('💡 Funciones de prueba para pagos disponibles en window.testPagos');
