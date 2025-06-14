package com.chat.peter.model;

/**
 * Representa un ítem dentro de un pedido.
 */
public class PedidoItem {
    private String nombre;
    private String descripcion;
    private String categoria;
    private int cantidad;
    private double precio;
    
    // Propiedades específicas para cocina
    private String estado; // Estado específico del item en cocina
    private String observaciones; // Observaciones específicas del item
    private Integer tiempoPreparacion; // Tiempo estimado de preparación en minutos
    
    public PedidoItem() {
        this.cantidad = 1;
    }
    
    public PedidoItem(String nombre, String categoria, double precio) {
        this.nombre = nombre;
        this.categoria = categoria;
        this.precio = precio;
        this.cantidad = 1;
    }
    
    public PedidoItem(String nombre, String descripcion, String categoria, int cantidad, double precio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.cantidad = cantidad;
        this.precio = precio;
    }
    
    // Getters y Setters
    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }

    public double getPrecio() {
        return precio;
    }

    public void setPrecio(double precio) {
        this.precio = precio;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Integer getTiempoPreparacion() {
        return tiempoPreparacion;
    }

    public void setTiempoPreparacion(Integer tiempoPreparacion) {
        this.tiempoPreparacion = tiempoPreparacion;
    }
}
