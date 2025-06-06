package com.chat.peter.model;

/**
 * Enumeración que representa los diferentes tipos de pedidos disponibles.
 * Permite distinguir entre pedidos normales y micropedidos para aplicar
 * lógicas de negocio específicas como descuentos y tiempos de preparación.
 */
public enum TipoPedido {
    /**
     * Pedido normal con múltiples items y proceso estándar
     */
    NORMAL,
    
    /**
     * Micropedido: máximo 3 items, proceso simplificado y descuentos especiales
     */
    MICROPEDIDO
}
