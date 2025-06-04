package com.chat.peter.model;

/**
 * Enumeración que representa los métodos de pago disponibles en el sistema.
 * Todos los métodos son simulados para fines demostrativos del MVP.
 */
public enum MetodoPago {
    /**
     * Pago en efectivo al momento de la entrega
     */
    EFECTIVO,
    
    /**
     * Pago con tarjeta de crédito o débito (simulado)
     */
    TARJETA,
    
    /**
     * Pago a través de Nequi (simulado)
     */
    NEQUI,
    
    /**
     * Pago a través de PSE (simulado)
     */
    PSE,
    
    /**
     * Pago a través de Daviplata (simulado)
     */
    DAVIPLATA
}
