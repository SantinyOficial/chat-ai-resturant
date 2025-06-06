/**
 * TEST PARA REPRODUCIR EL PROBLEMA DEL MESERO
 *
 * Este test simula exactamente el problema que se ve en la imagen:
 * El cliente paga, pero el mesero sigue viendo "PENDIENTE DE PAGO"
 */

console.log('🚨 REPRODUCIENDO PROBLEMA DEL MESERO...\n');

// Mock localStorage
const mockStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  clear: function() {
    this.data = {};
  }
};

// 1. SIMULAR PEDIDOS EXISTENTES (como los vería el mesero inicialmente)
const pedidosIniciales = [
  {
    id: '68424358',
    clienteNombre: 'Cliente 1',
    mesa: 3,
    items: [{ nombre: 'Ensalada fresca', cantidad: 1 }],
    total: 'COP5',
    estado: 'PENDIENTE',
    estadoPago: 'PENDIENTE_PAGO',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: '68424139',
    clienteNombre: 'Cliente 2',
    mesa: 2,
    items: [{ nombre: 'Ensalada fresca', cantidad: 1 }],
    total: 'COP5',
    estado: 'PENDIENTE',
    estadoPago: 'PENDIENTE_PAGO',
    fechaCreacion: new Date().toISOString()
  },
  {
    id: '68423041',
    clienteNombre: 'Santiago',
    mesa: 1,
    items: [{ nombre: 'Ensalada fresca', cantidad: 2 }],
    total: 'COP10',
    estado: 'PENDIENTE',
    estadoPago: 'PENDIENTE_PAGO',
    fechaCreacion: new Date().toISOString()
  }
];

mockStorage.setItem('pedidos', JSON.stringify(pedidosIniciales));
console.log('📋 1. ESTADO INICIAL DEL MESERO');
console.log('   Pedidos cargados:', pedidosIniciales.length);
console.log('   Todos con estado: PENDIENTE_PAGO');

// 2. SIMULAR QUE EL CLIENTE PAGA EL PEDIDO 68423041 (Santiago, Mesa 1)
console.log('\n💰 2. CLIENTE PAGA EL PEDIDO');
const pedidoPagado = '68423041';
console.log('   Cliente Santiago paga pedido:', pedidoPagado);

// 2.1 Actualizar en pedidos principales
const pedidos = JSON.parse(mockStorage.getItem('pedidos'));
const pedidoIndex = pedidos.findIndex(p => p.id === pedidoPagado);
if (pedidoIndex !== -1) {
  pedidos[pedidoIndex].estadoPago = 'PAGO_REALIZADO';
  pedidos[pedidoIndex].fechaPago = new Date().toISOString();
  pedidos[pedidoIndex].transaccionId = 'TXN-123456789';
  mockStorage.setItem('pedidos', JSON.stringify(pedidos));
  console.log('   ✅ Pedido actualizado en lista principal');
}

// 2.2 Guardar en estados separados
const estadosPago = {};
estadosPago[pedidoPagado] = {
  estadoPago: 'PAGO_REALIZADO',
  fechaPago: new Date().toISOString(),
  transaccionId: 'TXN-123456789',
  metodoPago: 'tarjeta'
};
mockStorage.setItem('estados_pago_pedidos', JSON.stringify(estadosPago));
console.log('   ✅ Estado guardado en registro separado');

// 2.3 Crear notificación para mesero
const notificaciones = [{
  id: 'notif-' + Date.now(),
  tipo: 'PAGO_COMPLETADO',
  pedidoId: pedidoPagado,
  mesa: 1,
  clienteNombre: 'Santiago',
  total: 'COP10',
  fechaNotificacion: new Date().toISOString(),
  leida: false,
  accionRequerida: 'ACEPTAR_PEDIDO'
}];
mockStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));
console.log('   ✅ Notificación creada para mesero');

// 3. SIMULAR LA FUNCIÓN DEL MESERO: cargarEstadosPagosPersistentes
console.log('\n🔍 3. MESERO CARGA ESTADOS DE PAGO');

function cargarEstadosPagosPersistentes() {
  console.log('   🔄 Cargando estados de pago persistentes...');
  const estadosPagoMesero = {};

  try {
    // Cargar desde el almacenamiento separado de estados de pago
    const estadosPago = JSON.parse(mockStorage.getItem('estados_pago_pedidos') || '{}');
    Object.entries(estadosPago).forEach(([pedidoId, estado]) => {
      estadosPagoMesero[pedidoId] = estado.estadoPago;
      console.log(`   💾 Estado de pago cargado para ${pedidoId}: ${estado.estadoPago}`);
    });

    // Cargar desde localStorage de pedidos como respaldo
    const pedidos = JSON.parse(mockStorage.getItem('pedidos') || '[]');
    pedidos.forEach(pedido => {
      if (pedido.estadoPago && !estadosPagoMesero[pedido.id]) {
        estadosPagoMesero[pedido.id] = pedido.estadoPago;
        console.log(`   💾 Estado de pago cargado desde pedidos para ${pedido.id}: ${pedido.estadoPago}`);
      }
    });

    console.log('   ✅ Estados de pago persistentes cargados:', estadosPagoMesero);
    return estadosPagoMesero;
  } catch (error) {
    console.error('   ❌ Error cargando estados de pago persistentes:', error);
    return {};
  }
}

const estadosPagoMesero = cargarEstadosPagosPersistentes();

// 4. SIMULAR LA FUNCIÓN getEstadoPago DEL MESERO
console.log('\n🎯 4. VERIFICAR ESTADO DE PAGO PARA CADA PEDIDO');

function getEstadoPago(pedidoId) {
  const estado = estadosPagoMesero[pedidoId] || 'PENDIENTE_PAGO';
  console.log(`   📊 Pedido ${pedidoId}: ${estado}`);
  return estado;
}

// Verificar todos los pedidos
pedidosIniciales.forEach(pedido => {
  const estadoPago = getEstadoPago(pedido.id);
  const puedeAceptar = estadoPago === 'PAGO_REALIZADO' && pedido.estado === 'PENDIENTE';
  console.log(`   🍽️ Pedido ${pedido.id} (Mesa ${pedido.mesa}): ${estadoPago} - Puede aceptar: ${puedeAceptar}`);
});

// 5. DIAGNÓSTICO DEL PROBLEMA
console.log('\n🔍 5. DIAGNÓSTICO FINAL');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const pedidosFinales = JSON.parse(mockStorage.getItem('pedidos'));
const estadosFinales = JSON.parse(mockStorage.getItem('estados_pago_pedidos'));
const notificacionesFinales = JSON.parse(mockStorage.getItem('notificaciones_mesero'));

console.log('📊 DATOS FINALES EN LOCALSTORAGE:');
console.log('   📋 Pedidos:', pedidosFinales.length);
console.log('   💰 Estados de pago:', Object.keys(estadosFinales).length);
console.log('   🔔 Notificaciones:', notificacionesFinales.length);

console.log('\n📝 DETALLE DEL PEDIDO PAGADO (68423041):');
const pedidoPagadoDetalle = pedidosFinales.find(p => p.id === pedidoPagado);
console.log('   En lista de pedidos:', {
  id: pedidoPagadoDetalle?.id,
  estadoPago: pedidoPagadoDetalle?.estadoPago,
  transaccionId: pedidoPagadoDetalle?.transaccionId
});
console.log('   En estados separados:', estadosFinales[pedidoPagado]);
console.log('   En cache del mesero:', estadosPagoMesero[pedidoPagado]);

console.log('\n🎯 RESULTADO:');
if (estadosPagoMesero[pedidoPagado] === 'PAGO_REALIZADO') {
  console.log('   ✅ ÉXITO: El mesero puede ver el pago completado');
  console.log('   🍽️ El pedido debería mostrar botón "Aceptar"');
} else {
  console.log('   ❌ PROBLEMA: El mesero NO puede ver el pago completado');
  console.log('   ⚠️ El pedido sigue mostrando "Esperando confirmación de pago"');
}

console.log('\n✨ TEST COMPLETADO');
