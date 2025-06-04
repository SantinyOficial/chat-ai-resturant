package com.chat.peter.model;

import java.time.LocalDateTime;

/**
 * Representa un comando de voz ejecutado en el módulo de cocina.
 * Permite registrar las acciones realizadas por comandos de voz
 * para el seguimiento y auditoría del sistema.
 */
public class ComandoVoz {
    
    private String id;
    private String comandoOriginal;
    private String accionEjecutada;
    private String pedidoId;
    private String usuarioId; // ID de la cocinera que ejecutó el comando
    private LocalDateTime fechaEjecucion;
    private boolean exitoso;
    private String mensajeError;
    
    // Constructor por defecto
    public ComandoVoz() {
        this.fechaEjecucion = LocalDateTime.now();
    }
    
    /**
     * Constructor con parámetros principales
     * @param comandoOriginal Texto del comando de voz original
     * @param accionEjecutada Acción que se ejecutó como resultado
     * @param pedidoId ID del pedido afectado (si aplica)
     */
    public ComandoVoz(String comandoOriginal, String accionEjecutada, String pedidoId) {
        this();
        this.comandoOriginal = comandoOriginal;
        this.accionEjecutada = accionEjecutada;
        this.pedidoId = pedidoId;
        this.exitoso = true;
    }
    
    /**
     * Marca el comando como ejecutado exitosamente
     */
    public void marcarExitoso() {
        this.exitoso = true;
        this.mensajeError = null;
    }
    
    /**
     * Marca el comando como fallido
     * @param error Mensaje de error
     */
    public void marcarFallido(String error) {
        this.exitoso = false;
        this.mensajeError = error;
    }
    
    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getComandoOriginal() {
        return comandoOriginal;
    }

    public void setComandoOriginal(String comandoOriginal) {
        this.comandoOriginal = comandoOriginal;
    }

    public String getAccionEjecutada() {
        return accionEjecutada;
    }

    public void setAccionEjecutada(String accionEjecutada) {
        this.accionEjecutada = accionEjecutada;
    }

    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public String getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(String usuarioId) {
        this.usuarioId = usuarioId;
    }

    public LocalDateTime getFechaEjecucion() {
        return fechaEjecucion;
    }

    public void setFechaEjecucion(LocalDateTime fechaEjecucion) {
        this.fechaEjecucion = fechaEjecucion;
    }

    public boolean isExitoso() {
        return exitoso;
    }

    public void setExitoso(boolean exitoso) {
        this.exitoso = exitoso;
    }

    public String getMensajeError() {
        return mensajeError;
    }

    public void setMensajeError(String mensajeError) {
        this.mensajeError = mensajeError;
    }
}
