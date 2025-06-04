package com.chat.peter.model;

import java.time.LocalDateTime;

/**
 * Representa un pago asociado a un pedido.
 * Maneja toda la información relacionada con el procesamiento
 * de pagos de forma simulada para fines demostrativos.
 */
public class Pago {
    
    private String id;
    private String pedidoId;
    private MetodoPago metodoPago;
    private double monto;
    private EstadoPago estado;
    private String codigoTransaccion;
    private String referenciaPago;
    private LocalDateTime fechaPago;
    private LocalDateTime fechaProcesamiento;
    private String observaciones;
    
    // Campos específicos para pagos
    private String estadoPago;
    private String transaccionId;
    private String referenciaBanco;
    private String mensajeError;
    
    // Campos para tarjetas
    private String numeroTarjeta;
    private String nombreTarjeta;
    private String fechaVencimiento;
    private String cvv;
    
    // Campos para pagos digitales
    private String telefonoNequi;
    private String telefonoDaviplata;
    
    // Campos para PSE
    private String bancoPSE;
    private String tipoPersona;
    private String numeroDocumento;
    
    // Constructor por defecto
    public Pago() {
        this.estado = EstadoPago.PENDIENTE;
        this.fechaPago = LocalDateTime.now();
    }
    
    /**
     * Constructor con parámetros principales
     * @param pedidoId ID del pedido asociado
     * @param metodoPago Método de pago seleccionado
     * @param monto Monto total a pagar
     */
    public Pago(String pedidoId, MetodoPago metodoPago, double monto) {
        this();
        this.pedidoId = pedidoId;
        this.metodoPago = metodoPago;
        this.monto = monto;
        this.generarCodigoTransaccion();
    }
    
    /**
     * Genera un código de transacción ficticio para la demostración
     */
    private void generarCodigoTransaccion() {
        String prefijo = metodoPago != null ? metodoPago.name().substring(0, 2) : "XX";
        long timestamp = System.currentTimeMillis();
        this.codigoTransaccion = prefijo + timestamp % 1000000;
    }
    
    /**
     * Simula el procesamiento del pago
     */
    public void procesar() {
        this.estado = EstadoPago.PROCESANDO;
        this.fechaProcesamiento = LocalDateTime.now();
    }
    
    /**
     * Confirma el pago exitoso
     */
    public void confirmar() {
        this.estado = EstadoPago.CONFIRMADO;
        this.fechaProcesamiento = LocalDateTime.now();
    }
    
    /**
     * Marca el pago como fallido
     * @param motivo Motivo del fallo
     */
    public void fallar(String motivo) {
        this.estado = EstadoPago.FALLIDO;
        this.observaciones = motivo;
        this.fechaProcesamiento = LocalDateTime.now();
    }
    
    // Enumeración interna para estados de pago
    public enum EstadoPago {
        PENDIENTE,
        PROCESANDO,
        CONFIRMADO,
        FALLIDO
    }
    
    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public MetodoPago getMetodoPago() {
        return metodoPago;
    }

    public void setMetodoPago(MetodoPago metodoPago) {
        this.metodoPago = metodoPago;
        this.generarCodigoTransaccion();
    }

    public double getMonto() {
        return monto;
    }

    public void setMonto(double monto) {
        this.monto = monto;
    }

    public EstadoPago getEstado() {
        return estado;
    }

    public void setEstado(EstadoPago estado) {
        this.estado = estado;
    }

    public String getCodigoTransaccion() {
        return codigoTransaccion;
    }

    public void setCodigoTransaccion(String codigoTransaccion) {
        this.codigoTransaccion = codigoTransaccion;
    }

    public String getReferenciaPago() {
        return referenciaPago;
    }

    public void setReferenciaPago(String referenciaPago) {
        this.referenciaPago = referenciaPago;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }

    public LocalDateTime getFechaProcesamiento() {
        return fechaProcesamiento;
    }

    public void setFechaProcesamiento(LocalDateTime fechaProcesamiento) {
        this.fechaProcesamiento = fechaProcesamiento;
    }

    public String getObservaciones() {
        return observaciones;
    }    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    // Getters y setters para campos específicos de pago
    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }

    public String getTransaccionId() {
        return transaccionId;
    }

    public void setTransaccionId(String transaccionId) {
        this.transaccionId = transaccionId;
    }

    public String getReferenciaBanco() {
        return referenciaBanco;
    }

    public void setReferenciaBanco(String referenciaBanco) {
        this.referenciaBanco = referenciaBanco;
    }

    public String getMensajeError() {
        return mensajeError;
    }

    public void setMensajeError(String mensajeError) {
        this.mensajeError = mensajeError;
    }

    // Getters y setters para campos de tarjeta
    public String getNumeroTarjeta() {
        return numeroTarjeta;
    }

    public void setNumeroTarjeta(String numeroTarjeta) {
        this.numeroTarjeta = numeroTarjeta;
    }

    public String getNombreTarjeta() {
        return nombreTarjeta;
    }

    public void setNombreTarjeta(String nombreTarjeta) {
        this.nombreTarjeta = nombreTarjeta;
    }

    public String getFechaVencimiento() {
        return fechaVencimiento;
    }

    public void setFechaVencimiento(String fechaVencimiento) {
        this.fechaVencimiento = fechaVencimiento;
    }

    public String getCvv() {
        return cvv;
    }

    public void setCvv(String cvv) {
        this.cvv = cvv;
    }

    // Getters y setters para pagos digitales
    public String getTelefonoNequi() {
        return telefonoNequi;
    }

    public void setTelefonoNequi(String telefonoNequi) {
        this.telefonoNequi = telefonoNequi;
    }

    public String getTelefonoDaviplata() {
        return telefonoDaviplata;
    }

    public void setTelefonoDaviplata(String telefonoDaviplata) {
        this.telefonoDaviplata = telefonoDaviplata;
    }

    // Getters y setters para PSE
    public String getBancoPSE() {
        return bancoPSE;
    }

    public void setBancoPSE(String bancoPSE) {
        this.bancoPSE = bancoPSE;
    }

    public String getTipoPersona() {
        return tipoPersona;
    }

    public void setTipoPersona(String tipoPersona) {
        this.tipoPersona = tipoPersona;
    }

    public String getNumeroDocumento() {
        return numeroDocumento;
    }

    public void setNumeroDocumento(String numeroDocumento) {
        this.numeroDocumento = numeroDocumento;
    }
}
