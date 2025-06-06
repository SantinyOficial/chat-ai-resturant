// Test de depuración para el sistema de pagos
console.log('🔍 INICIANDO DEBUG DEL SISTEMA DE PAGOS');

// Simular localStorage para testing
const mockLocalStorage = {
  storage: {},
  getItem(key) {
    return this.storage[key] || null;
  },
  setItem(key, value) {
    this.storage[key] = value;
    console.log(`📦 localStorage.setItem("${key}", "${value}")`);
  },
  clear() {
    this.storage = {};
  }
};

// Simular un pedido de prueba
const pedidoPrueba = {
  id: 'TEST-PEDIDO-001',
  clienteNombre: 'Cliente Test',
  mesa: 5,
  total: 25000,
  items: [
    { nombre: 'Hamburguesa', precio: 15000 },
    { nombre: 'Papas Fritas', precio: 8000 },
    { nombre: 'Coca Cola', precio: 2000 }
  ],
  estado: 'PENDIENTE',
  fechaCreacion: new Date().toISOString()
};

// Simular el proceso de pago
console.log('\n🍔 1. CREANDO PEDIDO DE PRUEBA');
console.log('Pedido:', pedidoPrueba);

// Guardar pedido en localStorage simulado
const pedidos = [pedidoPrueba];
mockLocalStorage.setItem('pedidos', JSON.stringify(pedidos));

console.log('\n💳 2. SIMULANDO PROCESO DE PAGO');

// Simular resultado de pago exitoso
const resultadoPago = {
  exito: true,
  codigoTransaccion: 'TXN-TEST-' + Date.now(),
  mensaje: 'Pago procesado exitosamente',
  metodoPago: 'tarjeta',
  monto: pedidoPrueba.total
};

console.log('Resultado del pago:', resultadoPago);

console.log('\n💾 3. SIMULANDO GUARDADO DE ESTADO PERSISTENTE');

// Función de guardado persistente (basada en la implementación real)
function guardarEstadoPagoPersistente(pedidoId, resultado) {
  console.log('🔄 Iniciando guardado de estado persistente para pedido:', pedidoId);

  try {
    // 1. Actualizar pedido existente
    const pedidosString = mockLocalStorage.getItem('pedidos');
    const pedidos = JSON.parse(pedidosString || '[]');
    console.log('📋 Pedidos existentes:', pedidos.length);

    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);
    console.log('🔍 Índice del pedido encontrado:', pedidoIndex);

    if (pedidoIndex !== -1) {
      const transaccionId = resultado.codigoTransaccion || 'TXN-' + Date.now();
      const fechaPago = new Date().toISOString();

      pedidos[pedidoIndex].estadoPago = 'PAGO_REALIZADO';
      pedidos[pedidoIndex].fechaPago = fechaPago;
      pedidos[pedidoIndex].transaccionId = transaccionId;
      pedidos[pedidoIndex].metodoPago = 'tarjeta';

      mockLocalStorage.setItem('pedidos', JSON.stringify(pedidos));
      console.log('✅ Pedido actualizado con estado de pago');

      // 2. Guardar en registro separado
      const estadosPago = {};
      estadosPago[pedidoId] = {
        estadoPago: 'PAGO_REALIZADO',
        fechaPago: fechaPago,
        transaccionId: transaccionId,
        metodoPago: 'tarjeta',
        monto: resultado.monto
      };
      mockLocalStorage.setItem('estados_pago_pedidos', JSON.stringify(estadosPago));
      console.log('💾 Estado guardado en registro separado');

      // 3. Crear notificación para mesero
      const notificaciones = [];
      const nuevaNotificacion = {
        id: 'notif-' + Date.now(),
        tipo: 'PAGO_COMPLETADO',
        pedidoId: pedidoId,
        mesa: pedidos[pedidoIndex].mesa,
        clienteNombre: pedidos[pedidoIndex].clienteNombre,
        total: pedidos[pedidoIndex].total,
        fechaNotificacion: new Date().toISOString(),
        leida: false,
        accionRequerida: 'ACEPTAR_PEDIDO',
        metodoPago: 'tarjeta',
        transaccionId: transaccionId
      };

      notificaciones.push(nuevaNotificacion);
      mockLocalStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));
      console.log('🔔 Notificación creada para mesero');

      return true;
    } else {
      console.error('❌ PROBLEMA: No se encontró el pedido con ID:', pedidoId);
      return false;
    }
  } catch (error) {
    console.error('❌ Error en guardado persistente:', error);
    return false;
  }
}

// Ejecutar el guardado
const exito = guardarEstadoPagoPersistente(pedidoPrueba.id, resultadoPago);

console.log('\n🔍 4. VERIFICANDO GUARDADO');

// Verificar que se guardó correctamente
const pedidosGuardados = JSON.parse(mockLocalStorage.getItem('pedidos') || '[]');
const estadosGuardados = JSON.parse(mockLocalStorage.getItem('estados_pago_pedidos') || '{}');
const notificacionesGuardadas = JSON.parse(mockLocalStorage.getItem('notificaciones_mesero') || '[]');

console.log('📊 RESULTADOS DE LA VERIFICACIÓN:');
console.log('- Pedidos guardados:', pedidosGuardados.length);
console.log('- Pedido con pago realizado:', pedidosGuardados[0]?.estadoPago === 'PAGO_REALIZADO');
console.log('- Estados de pago guardados:', Object.keys(estadosGuardados).length);
console.log('- Notificaciones para mesero:', notificacionesGuardadas.length);

console.log('\n📋 DETALLES DEL PEDIDO GUARDADO:');
console.log(JSON.stringify(pedidosGuardados[0], null, 2));

console.log('\n🔔 DETALLES DE LA NOTIFICACIÓN:');
console.log(JSON.stringify(notificacionesGuardadas[0], null, 2));

console.log('\n✅ SISTEMA DE GUARDADO:', exito ? 'FUNCIONANDO' : 'CON ERRORES');

// Simular carga desde el lado del mesero
console.log('\n👨‍🍳 5. SIMULANDO CARGA DESDE EL MESERO');

function cargarPagosCompletados() {
  const pedidos = JSON.parse(mockLocalStorage.getItem('pedidos') || '[]');
  const estadosPago = JSON.parse(mockLocalStorage.getItem('estados_pago_pedidos') || '{}');
  const notificaciones = JSON.parse(mockLocalStorage.getItem('notificaciones_mesero') || '[]');

  console.log('📊 DATOS CARGADOS POR EL MESERO:');
  console.log('- Total pedidos:', pedidos.length);
  console.log('- Pedidos con pago realizado:', pedidos.filter(p => p.estadoPago === 'PAGO_REALIZADO').length);
  console.log('- Estados de pago separados:', Object.keys(estadosPago).length);
  console.log('- Notificaciones no leídas:', notificaciones.filter(n => !n.leida).length);

  const pedidosConPagoCompletado = pedidos.filter(p =>
    p.estadoPago === 'PAGO_REALIZADO' && p.estado === 'PENDIENTE'
  );

  console.log('🔔 PEDIDOS LISTOS PARA ACEPTAR:', pedidosConPagoCompletado.length);

  if (pedidosConPagoCompletado.length > 0) {
    console.log('✅ EL MESERO PUEDE VER EL PEDIDO CON PAGO COMPLETADO');
    return true;
  } else {
    console.log('❌ EL MESERO NO PUEDE VER PEDIDOS CON PAGO COMPLETADO');
    return false;
  }
}

const meseroVePedidos = cargarPagosCompletados();

console.log('\n🏁 RESULTADO FINAL:');
console.log('================================');
console.log('Guardado de pago:', exito ? '✅' : '❌');
console.log('Mesero ve pedidos:', meseroVePedidos ? '✅' : '❌');
console.log('Sistema funcionando:', (exito && meseroVePedidos) ? '✅ CORRECTO' : '❌ CON PROBLEMAS');

if (exito && meseroVePedidos) {
  console.log('\n🎉 EL SISTEMA DE PERSISTENCIA ESTÁ FUNCIONANDO CORRECTAMENTE');
  console.log('El problema puede estar en:');
  console.log('- Timing de eventos');
  console.log('- Sincronización entre componentes');
  console.log('- Detección de cambios de Angular');
  console.log('- Eventos del DOM no disparándose');
} else {
  console.log('\n🚨 PROBLEMA IDENTIFICADO EN EL SISTEMA DE PERSISTENCIA');
}
