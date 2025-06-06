// Test del flujo completo de pago persistente
// Este script simula el flujo de crear un pedido, procesarlo, y verificar que el mesero pueda confirmarlo

console.log('🧪 INICIANDO PRUEBA DEL FLUJO DE PAGO PERSISTENTE');

// 1. Simular creación de un pedido
const pedidoPrueba = {
  id: 'pedido-test-' + Date.now(),
  clienteNombre: 'Cliente Prueba',
  clienteId: 'cliente-test-123',
  mesa: 5,
  items: [
    {
      nombre: 'Hamburguesa Clásica',
      categoria: 'Platos principales',
      cantidad: 1,
      precio: 25000
    },
    {
      nombre: 'Papas Fritas',
      categoria: 'Acompañamientos',
      cantidad: 1,
      precio: 8000
    }
  ],
  total: 33000,
  estado: 'PENDIENTE',
  estadoPago: 'PENDIENTE_PAGO',
  fechaCreacion: new Date().toISOString()
};

console.log('📝 Pedido de prueba creado:', pedidoPrueba);

// 2. Guardar el pedido en localStorage
try {
  const pedidosExistentes = JSON.parse(localStorage.getItem('pedidos') || '[]');
  pedidosExistentes.push(pedidoPrueba);
  localStorage.setItem('pedidos', JSON.stringify(pedidosExistentes));
  console.log('✅ Pedido guardado en localStorage');
} catch (error) {
  console.error('❌ Error guardando pedido:', error);
}

// 3. Simular procesamiento de pago
console.log('💳 Simulando procesamiento de pago...');

setTimeout(() => {
  try {
    // Simular pago exitoso
    const resultadoPago = {
      success: true,
      codigoTransaccion: 'TXN-TEST-' + Date.now(),
      metodoPago: 'tarjeta',
      mensaje: 'Pago procesado exitosamente'
    };

    console.log('💰 Pago simulado exitoso:', resultadoPago);

    // 4. Actualizar estado del pedido
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoPrueba.id);

    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].estadoPago = 'PAGO_REALIZADO';
      pedidos[pedidoIndex].fechaPago = new Date().toISOString();
      pedidos[pedidoIndex].transaccionId = resultadoPago.codigoTransaccion;
      pedidos[pedidoIndex].metodoPago = 'tarjeta';

      localStorage.setItem('pedidos', JSON.stringify(pedidos));
      console.log('✅ Estado de pago actualizado en localStorage');

      // 5. Crear notificación para el mesero
      const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
      const nuevaNotificacion = {
        id: 'notif-test-' + Date.now(),
        tipo: 'PAGO_COMPLETADO',
        pedidoId: pedidoPrueba.id,
        mesa: pedidoPrueba.mesa,
        clienteNombre: pedidoPrueba.clienteNombre,
        total: pedidoPrueba.total,
        fechaNotificacion: new Date().toISOString(),
        leida: false,
        accionRequerida: 'ACEPTAR_PEDIDO',
        metodoPago: 'tarjeta',
        transaccionId: resultadoPago.codigoTransaccion
      };

      notificaciones.push(nuevaNotificacion);
      localStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));
      console.log('🔔 Notificación para mesero creada:', nuevaNotificacion);

      // 6. Emitir evento global
      const evento = new CustomEvent('pagoCompletado', {
        detail: {
          pedidoId: pedidoPrueba.id,
          estadoPago: 'PAGO_REALIZADO',
          transaccionId: resultadoPago.codigoTransaccion
        }
      });
      window.dispatchEvent(evento);
      console.log('📡 Evento global emitido');

      // 7. Verificar estado final
      console.log('🔍 VERIFICACIÓN FINAL:');
      console.log('- Pedido guardado:', !!pedidos.find(p => p.id === pedidoPrueba.id));
      console.log('- Estado de pago:', pedidos[pedidoIndex].estadoPago);
      console.log('- Notificación creada:', !!notificaciones.find(n => n.pedidoId === pedidoPrueba.id));
      console.log('- Transacción ID:', pedidos[pedidoIndex].transaccionId);

      console.log('🎉 PRUEBA COMPLETADA EXITOSAMENTE');
      console.log('📋 El mesero ahora puede ver y aceptar este pedido en Gestión de Pedidos');

    } else {
      console.error('❌ No se encontró el pedido para actualizar');
    }

  } catch (error) {
    console.error('❌ Error en simulación de pago:', error);
  }
}, 2000);

// 8. Función para limpiar datos de prueba
window.limpiarPrueba = function() {
  try {
    // Limpiar pedidos de prueba
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    const pedidosLimpios = pedidos.filter(p => !p.id.includes('test'));
    localStorage.setItem('pedidos', JSON.stringify(pedidosLimpios));

    // Limpiar notificaciones de prueba
    const notificaciones = JSON.parse(localStorage.getItem('notificaciones_mesero') || '[]');
    const notificacionesLimpias = notificaciones.filter(n => !n.id.includes('test'));
    localStorage.setItem('notificaciones_mesero', JSON.stringify(notificacionesLimpias));

    console.log('🧹 Datos de prueba limpiados');
  } catch (error) {
    console.error('❌ Error limpiando datos de prueba:', error);
  }
};

console.log('💡 Para limpiar los datos de prueba, ejecute: limpiarPrueba()');
