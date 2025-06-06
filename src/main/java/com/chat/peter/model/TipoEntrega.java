package com.chat.peter.model;

/**
 * Enumeración que representa los diferentes tipos de entrega disponibles.
 * Permite al sistema gestionar pedidos presenciales y a domicilio
 * con lógicas diferenciadas de costo y seguimiento.
 */
public enum TipoEntrega {
    /**
     * Entrega presencial en el restaurante (para consumo en mesa)
     */
    PRESENCIAL,
    
    /**
     * Entrega a domicilio en dirección especificada por el cliente
     */
    DOMICILIO
}
