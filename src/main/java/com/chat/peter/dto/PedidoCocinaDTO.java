package com.chat.peter.dto;

import java.util.List;

public class PedidoCocinaDTO {
    private String id;
    private String clienteNombre;
    private Integer mesa;
    private String fechaRecibido;
    private String fechaInicio;
    private String estado;
    private String prioridad;
    private String observaciones;
    private String cocineroAsignado;
    private String tiempoEstimado;
    private List<ItemCocinaDTO> items;

    // Constructores
    public PedidoCocinaDTO() {}

    // Getters y Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getClienteNombre() {
        return clienteNombre;
    }

    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }

    public Integer getMesa() {
        return mesa;
    }

    public void setMesa(Integer mesa) {
        this.mesa = mesa;
    }

    public String getFechaRecibido() {
        return fechaRecibido;
    }

    public void setFechaRecibido(String fechaRecibido) {
        this.fechaRecibido = fechaRecibido;
    }

    public String getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(String fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getPrioridad() {
        return prioridad;
    }

    public void setPrioridad(String prioridad) {
        this.prioridad = prioridad;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public String getCocineroAsignado() {
        return cocineroAsignado;
    }

    public void setCocineroAsignado(String cocineroAsignado) {
        this.cocineroAsignado = cocineroAsignado;
    }

    public String getTiempoEstimado() {
        return tiempoEstimado;
    }

    public void setTiempoEstimado(String tiempoEstimado) {
        this.tiempoEstimado = tiempoEstimado;
    }

    public List<ItemCocinaDTO> getItems() {
        return items;
    }

    public void setItems(List<ItemCocinaDTO> items) {
        this.items = items;
    }
}
