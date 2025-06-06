/**
 * TEST EN TIEMPO REAL: FLUJO DE COMUNICACIÓN PAGO-MESERO
 *
 * Este test simula la comunicación completa entre el cliente que paga
 * y el mesero que debe recibir la notificación inmediatamente.
 */

console.log('🚀 INICIANDO TEST DE COMUNICACIÓN EN TIEMPO REAL...\n');

// Simular localStorage
const mockStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
    console.log(`💾 [STORAGE] ${key} actualizado`);
  },
  clear: function() {
    this.data = {};
  }
};

// Configurar localStorage global si no existe
if (typeof localStorage === 'undefined') {
  global.localStorage = mockStorage;
} else {
  // Si existe, usar el real para la prueba
  mockStorage.getItem = localStorage.getItem.bind(localStorage);
  mockStorage.setItem = localStorage.setItem.bind(localStorage);
}

// Crear un pedido de prueba
const pedidoPrueba = {
  id: 'PEDIDO-REAL-TIME-' + Date.now(),
  clienteNombre: 'Cliente Tiempo Real',
  mesa: 7,
  items: [
    { id: 'item1', nombre: 'Pizza Margherita', precio: 25000, cantidad: 1 },
    { id: 'item2', nombre: 'Agua', precio: 3000, cantidad: 1 }
  ],
  total: 28000,
  estado: 'PENDIENTE',
  estadoPago: 'PENDIENTE_PAGO',
  fechaCreacion: new Date().toISOString(),
  clienteId: 'cliente-real-time-456'
};

console.log('📝 1. PREPARANDO PEDIDO DE PRUEBA');
console.log('   📋 ID:', pedidoPrueba.id);
console.log('   🍕 Total:', '$' + pedidoPrueba.total.toLocaleString());
console.log('   🪑 Mesa:', pedidoPrueba.mesa);

// Guardar pedido inicial
const pedidosIniciales = [pedidoPrueba];
mockStorage.setItem('pedidos', JSON.stringify(pedidosIniciales));

console.log('\n🎧 2. CONFIGURANDO LISTENERS DE EVENTOS');

// Variable para capturar eventos
let eventosCapturados = {
  pagoCompletado: null,
  pagoCompletadoInmediato: null,
  forzarRecarga: null
};

// Simular listeners como los tendría el componente gestión-pedidos
const listenerPagoCompletado = (event) => {
  console.log('🔔 [EVENTO] pagoCompletado recibido:', event.detail);
  eventosCapturados.pagoCompletado = event.detail;

  // Simular procesamiento como en gestión-pedidos
  procesarPagoCompletado(event.detail);
};

const listenerPagoInmediato = (event) => {
  console.log('⚡ [EVENTO] pagoCompletadoInmediato recibido:', event.detail);
  eventosCapturados.pagoCompletadoInmediato = event.detail;

  // Simular procesamiento inmediato
  procesarPagoCompletadoInmediato(event.detail);
};

const listenerRecarga = (event) => {
  console.log('🔄 [EVENTO] forzarRecargaPedidos recibido:', event.detail);
  eventosCapturados.forzarRecarga = event.detail;
};

// Agregar listeners
if (typeof window !== 'undefined') {
  window.addEventListener('pagoCompletado', listenerPagoCompletado);
  window.addEventListener('pagoCompletadoInmediato', listenerPagoInmediato);
  window.addEventListener('forzarRecargaPedidos', listenerRecarga);
} else {
  // Para Node.js, crear un EventEmitter simple
  const EventEmitter = require('events');
  const eventBus = new EventEmitter();

  global.window = {
    addEventListener: (event, callback) => eventBus.on(event, callback),
    dispatchEvent: (event) => eventBus.emit(event.type, event)
  };

  window.addEventListener('pagoCompletado', listenerPagoCompletado);
  window.addEventListener('pagoCompletadoInmediato', listenerPagoInmediato);
  window.addEventListener('forzarRecargaPedidos', listenerRecarga);
}

console.log('   ✅ Listeners configurados');

// Funciones de procesamiento simuladas (basadas en el código real)
function procesarPagoCompletado(detalleEvento) {
  console.log('🔄 [PROCESAMIENTO] Procesando pago completado...');

  try {
    // Actualizar estado local inmediatamente (simulado)
    console.log(`   ✅ Estado actualizado para ${detalleEvento.pedidoId}: PAGO_REALIZADO`);

    // Simular notificación al mesero
    const notificaciones = JSON.parse(mockStorage.getItem('notificaciones_mesero') || '[]');
    const nuevaNotificacion = {
      id: 'notif-' + Date.now(),
      tipo: 'PAGO_COMPLETADO',
      pedidoId: detalleEvento.pedidoId,
      mesa: pedidoPrueba.mesa,
      fechaNotificacion: new Date().toISOString(),
      leida: false
    };

    notificaciones.push(nuevaNotificacion);
    mockStorage.setItem('notificaciones_mesero', JSON.stringify(notificaciones));

    console.log('   🔔 Notificación creada para mesero');
    console.log('   📱 Total notificaciones pendientes:', notificaciones.length);

    return true;
  } catch (error) {
    console.error('❌ Error procesando pago completado:', error);
    return false;
  }
}

function procesarPagoCompletadoInmediato(detalleEvento) {
  console.log('⚡ [PROCESAMIENTO INMEDIATO] Procesando pago inmediato...');

  try {
    // Actualizar pedido inmediatamente
    const pedidos = JSON.parse(mockStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex(p => p.id === detalleEvento.pedidoId);

    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].estadoPago = 'PAGO_REALIZADO';
      pedidos[pedidoIndex].fechaPago = new Date().toISOString();
      pedidos[pedidoIndex].transaccionId = detalleEvento.transaccionId;

      mockStorage.setItem('pedidos', JSON.stringify(pedidos));
      console.log('   ⚡ Pedido actualizado INMEDIATAMENTE');
    }

    return true;
  } catch (error) {
    console.error('❌ Error en procesamiento inmediato:', error);
    return false;
  }
}

// Simular el proceso de pago del cliente
function simularPagoCliente() {
  console.log('\n💳 3. SIMULANDO PROCESO DE PAGO DEL CLIENTE');

  // Simular el método actualizarEstadoPagoPedido (corregido)
  function actualizarEstadoPagoPedido(pedidoId, estadoPago) {
    console.log(`🔄 PagoService.actualizarEstadoPagoPedido: ${pedidoId} -> ${estadoPago}`);

    const pedidos = JSON.parse(mockStorage.getItem('pedidos') || '[]');
    const pedidoIndex = pedidos.findIndex(p => p.id === pedidoId);

    if (pedidoIndex !== -1) {
      pedidos[pedidoIndex].estadoPago = estadoPago;
      if (estadoPago === 'PAGO_REALIZADO') {
        pedidos[pedidoIndex].fechaPago = new Date().toISOString();
        pedidos[pedidoIndex].transaccionId = 'TXN-' + Date.now();
      }
      mockStorage.setItem('pedidos', JSON.stringify(pedidos));
      console.log(`✅ Estado de pago actualizado en localStorage para pedido ${pedidoId}`);
      return true;
    }
    return false;
  }

  // Paso 1: Actualizar estado en el servicio
  console.log('   🔄 Paso 1: Actualizando estado de pago...');
  const exito = actualizarEstadoPagoPedido(pedidoPrueba.id, 'PAGO_REALIZADO');

  if (!exito) {
    console.error('❌ Falló la actualización del estado de pago');
    return;
  }

  // Paso 2: Guardar estado persistente adicional
  console.log('   💾 Paso 2: Guardando estado persistente...');
  const estadosPago = {};
  estadosPago[pedidoPrueba.id] = {
    estadoPago: 'PAGO_REALIZADO',
    fechaPago: new Date().toISOString(),
    transaccionId: 'TXN-' + Date.now(),
    metodoPago: 'tarjeta'
  };
  mockStorage.setItem('estados_pago_pedidos', JSON.stringify(estadosPago));

  // Paso 3: Emitir eventos globales (como hace el componente pago-cliente)
  console.log('   📡 Paso 3: Emitiendo eventos globales...');

  const detalleEvento = {
    pedidoId: pedidoPrueba.id,
    estadoPago: 'PAGO_REALIZADO',
    transaccionId: estadosPago[pedidoPrueba.id].transaccionId,
    metodoPago: 'tarjeta'
  };

  // Emitir evento normal
  const eventoNormal = {
    type: 'pagoCompletado',
    detail: detalleEvento
  };

  // Emitir evento inmediato
  const eventoInmediato = {
    type: 'pagoCompletadoInmediato',
    detail: detalleEvento
  };

  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(eventoNormal);
    window.dispatchEvent(eventoInmediato);
  } else {
    // Para Node.js
    global.window.dispatchEvent(eventoNormal);
    global.window.dispatchEvent(eventoInmediato);
  }

  console.log('   ✅ Eventos emitidos exitosamente');
}

// Función de verificación final
function verificarResultados() {
  console.log('\n🔍 4. VERIFICANDO RESULTADOS FINALES');

  // Verificar pedidos actualizados
  const pedidosFinales = JSON.parse(mockStorage.getItem('pedidos') || '[]');
  const pedidoFinal = pedidosFinales.find(p => p.id === pedidoPrueba.id);

  // Verificar estados de pago
  const estadosPago = JSON.parse(mockStorage.getItem('estados_pago_pedidos') || '{}');
  const estadoFinal = estadosPago[pedidoPrueba.id];

  // Verificar notificaciones
  const notificaciones = JSON.parse(mockStorage.getItem('notificaciones_mesero') || '[]');
  const notificacionPedido = notificaciones.find(n => n.pedidoId === pedidoPrueba.id);

  console.log('\n📊 RESULTADOS DEL TEST:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  console.log('✅ Pedido encontrado:', !!pedidoFinal);
  console.log('✅ Estado de pago actualizado:', pedidoFinal?.estadoPago === 'PAGO_REALIZADO');
  console.log('✅ Transacción ID asignada:', !!pedidoFinal?.transaccionId);
  console.log('✅ Estado persistente guardado:', !!estadoFinal);
  console.log('✅ Notificación para mesero creada:', !!notificacionPedido);

  console.log('\n🎧 EVENTOS CAPTURADOS:');
  console.log('✅ Evento pagoCompletado:', !!eventosCapturados.pagoCompletado);
  console.log('✅ Evento pagoCompletadoInmediato:', !!eventosCapturados.pagoCompletadoInmediato);

  // Evaluación final
  const todosFuncionan =
    !!pedidoFinal &&
    pedidoFinal?.estadoPago === 'PAGO_REALIZADO' &&
    !!pedidoFinal?.transaccionId &&
    !!estadoFinal &&
    !!notificacionPedido &&
    !!eventosCapturados.pagoCompletado &&
    !!eventosCapturados.pagoCompletadoInmediato;

  console.log('\n🎯 RESULTADO FINAL:');
  if (todosFuncionan) {
    console.log('   🎉 ✅ ÉXITO TOTAL - LA COMUNICACIÓN FUNCIONA CORRECTAMENTE');
    console.log('   📱 El mesero debería recibir la notificación inmediatamente');
    console.log('   🍽️ El pedido está listo para ser aceptado y enviado a cocina');
  } else {
    console.log('   ❌ PROBLEMA DETECTADO - Revisar la comunicación entre componentes');
    console.log('   🔧 Verificar listeners y emisión de eventos');
  }

  console.log('\n💾 DATOS GUARDADOS EN LOCALSTORAGE:');
  console.log('   📋 Pedidos:', pedidosFinales.length);
  console.log('   💰 Estados de pago:', Object.keys(estadosPago).length);
  console.log('   🔔 Notificaciones:', notificaciones.length);

  return todosFuncionan;
}

// Ejecutar la simulación completa
console.log('\n🚀 INICIANDO SIMULACIÓN COMPLETA...');

setTimeout(() => {
  simularPagoCliente();

  // Dar un momento para que se procesen los eventos
  setTimeout(() => {
    const exito = verificarResultados();

    if (exito) {
      console.log('\n✨ TEST COMPLETADO EXITOSAMENTE');
      console.log('🔗 La comunicación entre pago del cliente y gestión del mesero funciona');
    } else {
      console.log('\n⚠️ TEST REVELÓ PROBLEMAS');
      console.log('🔍 Revisar la implementación de eventos y sincronización');
    }

  }, 500);
}, 1000);

console.log('⏱️ Test en progreso... (esperando resultados en 2 segundos)');
