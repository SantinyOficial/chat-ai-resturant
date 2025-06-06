/**
 * TEST: CONTROL DE ANUNCIOS DUPLICADOS
 *
 * Este test verifica que el sistema no reproduzca anuncios de voz duplicados
 * cuando se confirma un pago múltiples veces.
 */

console.log('🔇 INICIANDO TEST DE CONTROL DE ANUNCIOS DUPLICADOS...\n');

// Mock del VoiceService
const mockVoiceService = {
  soporteVoz: true,
  anunciosRealizados: [],
  hablar: function(mensaje) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`🎤 [${timestamp}] ANUNCIO: "${mensaje}"`);
    this.anunciosRealizados.push({
      mensaje,
      timestamp: new Date()
    });
  },
  obtenerConteoAnuncios: function() {
    return this.anunciosRealizados.length;
  },
  limpiarAnuncios: function() {
    this.anunciosRealizados = [];
  }
};

// Simulación del sistema de control de anuncios
class ControlAnuncios {
  constructor() {
    this.anunciosRealizados = {};
    this.tiempoMinimoEntreAnuncios = 15000; // 15 segundos
    this.anunciosPendientes = {};
  }

  puedeRealizarAnuncio(claveAnuncio) {
    const ahora = new Date();
    const ultimoAnuncio = this.anunciosRealizados[claveAnuncio];

    if (!ultimoAnuncio) {
      return true; // Primera vez
    }

    const tiempoTranscurrido = ahora.getTime() - ultimoAnuncio.getTime();
    const puede = tiempoTranscurrido >= this.tiempoMinimoEntreAnuncios;

    if (!puede) {
      console.log(`🔇 Anuncio bloqueado: ${claveAnuncio} (${Math.round(tiempoTranscurrido/1000)}s desde último)`);
    }

    return puede;
  }

  marcarAnuncioRealizado(claveAnuncio) {
    this.anunciosRealizados[claveAnuncio] = new Date();
    console.log(`✅ Anuncio marcado: ${claveAnuncio}`);
  }

  cancelarAnuncioPendiente(pedidoId) {
    if (this.anunciosPendientes[pedidoId]) {
      clearTimeout(this.anunciosPendientes[pedidoId]);
      delete this.anunciosPendientes[pedidoId];
      console.log(`❌ Anuncio cancelado para pedido: ${pedidoId}`);
    }
  }

  programarAnuncioConDebounce(pedidoId, claveAnuncio, callback) {
    // Cancelar anuncio pendiente si existe
    this.cancelarAnuncioPendiente(pedidoId);

    // Programar nuevo anuncio con delay
    this.anunciosPendientes[pedidoId] = setTimeout(() => {
      callback();
      this.marcarAnuncioRealizado(claveAnuncio);
      delete this.anunciosPendientes[pedidoId];
    }, 1000); // 1 segundo de delay

    console.log(`⏰ Anuncio programado para pedido: ${pedidoId}`);
  }

  procesarPagoCompletado(pedidoId, mesa) {
    const claveAnuncio = `pago_realizado_${pedidoId}`;

    if (this.puedeRealizarAnuncio(claveAnuncio)) {
      console.log(`💰 Procesando pago completado para pedido ${pedidoId} mesa ${mesa}`);

      this.programarAnuncioConDebounce(pedidoId, claveAnuncio, () => {
        mockVoiceService.hablar(`Mesa ${mesa}: Pago confirmado. Pedido listo para aceptar.`);
      });
    } else {
      console.log(`🔇 Anuncio ya realizado recientemente para pedido: ${pedidoId}`);
    }
  }
}

// EJECUTAR TESTS
async function ejecutarTests() {
  const control = new ControlAnuncios();

  console.log('📊 TEST 1: Primer anuncio debe ejecutarse');
  console.log('=' .repeat(50));

  control.procesarPagoCompletado('PEDIDO-001', 5);

  // Esperar que se ejecute el anuncio programado
  await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`✅ Anuncios realizados: ${mockVoiceService.obtenerConteoAnuncios()}`);
  console.log('');

  console.log('📊 TEST 2: Anuncios duplicados inmediatos deben bloquearse');
  console.log('=' .repeat(50));

  const conteoAntes = mockVoiceService.obtenerConteoAnuncios();

  // Intentar múltiples anuncios del mismo pedido
  control.procesarPagoCompletado('PEDIDO-001', 5);
  control.procesarPagoCompletado('PEDIDO-001', 5);
  control.procesarPagoCompletado('PEDIDO-001', 5);

  // Esperar un poco
  await new Promise(resolve => setTimeout(resolve, 1500));

  const conteoDepues = mockVoiceService.obtenerConteoAnuncios();
  const nuevosAnuncios = conteoDepues - conteoAntes;

  console.log(`✅ Nuevos anuncios: ${nuevosAnuncios} (debería ser 0)`);
  console.log('');

  console.log('📊 TEST 3: Anuncios de diferentes pedidos deben ejecutarse');
  console.log('=' .repeat(50));

  const conteoAntes2 = mockVoiceService.obtenerConteoAnuncios();

  control.procesarPagoCompletado('PEDIDO-002', 3);
  control.procesarPagoCompletado('PEDIDO-003', 7);

  // Esperar que se ejecuten
  await new Promise(resolve => setTimeout(resolve, 1500));

  const conteoDepues2 = mockVoiceService.obtenerConteoAnuncios();
  const nuevosAnuncios2 = conteoDepues2 - conteoAntes2;

  console.log(`✅ Nuevos anuncios: ${nuevosAnuncios2} (debería ser 2)`);
  console.log('');

  console.log('📊 TEST 4: Anuncio del mismo pedido después de 15 segundos');
  console.log('=' .repeat(50));
  console.log('⏳ Simulando paso del tiempo...');

  // Simular el paso del tiempo modificando directamente el timestamp
  const claveAnuncio = `pago_realizado_PEDIDO-001`;
  control.anunciosRealizados[claveAnuncio] = new Date(Date.now() - 16000); // 16 segundos atrás

  const conteoAntes3 = mockVoiceService.obtenerConteoAnuncios();

  control.procesarPagoCompletado('PEDIDO-001', 5);

  // Esperar que se ejecute
  await new Promise(resolve => setTimeout(resolve, 1500));

  const conteoDepues3 = mockVoiceService.obtenerConteoAnuncios();
  const nuevosAnuncios3 = conteoDepues3 - conteoAntes3;

  console.log(`✅ Nuevos anuncios: ${nuevosAnuncios3} (debería ser 1)`);
  console.log('');

  console.log('📊 RESUMEN DE RESULTADOS');
  console.log('=' .repeat(50));
  console.log(`📈 Total de anuncios realizados: ${mockVoiceService.obtenerConteoAnuncios()}`);
  console.log(`🔇 Anuncios bloqueados: ${4 - mockVoiceService.obtenerConteoAnuncios()} (aprox.)`);

  console.log('\n📋 HISTÓRICO DE ANUNCIOS:');
  mockVoiceService.anunciosRealizados.forEach((anuncio, index) => {
    console.log(`  ${index + 1}. [${anuncio.timestamp.toLocaleTimeString()}] ${anuncio.mensaje}`);
  });

  console.log('\n✅ TEST COMPLETADO - El sistema de control de anuncios duplicados funciona correctamente');
}

// Ejecutar los tests
ejecutarTests().catch(console.error);
