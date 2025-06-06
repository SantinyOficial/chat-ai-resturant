// Enums para el estado de los pagos y pedidos
export enum EstadoPagoPedido {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PROCESANDO_PAGO = 'PROCESANDO_PAGO',
  PAGO_REALIZADO = 'PAGO_REALIZADO',
  PAGO_FALLIDO = 'PAGO_FALLIDO'
}

export enum EstadoPedido {
  PENDIENTE = 'PENDIENTE',
  CONFIRMADO = 'CONFIRMADO',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO = 'LISTO',
  EN_CAMINO = 'EN_CAMINO',
  ENTREGADO = 'ENTREGADO',
  CANCELADO = 'CANCELADO'
}

export enum TipoDocumento {
  CC = 'CC', // Cédula de Ciudadanía
  CE = 'CE', // Cédula de Extranjería
  NIT = 'NIT', // Número de Identificación Tributaria
  PP = 'PP', // Pasaporte
  TI = 'TI'  // Tarjeta de Identidad
}

export enum MetodoPagoEnum {
  TARJETA = 'tarjeta',
  NEQUI = 'nequi',
  PSE = 'pse',
  DAVIPLATA = 'daviplata',
  EFECTIVO = 'efectivo'
}

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
