package com.chat.peter.model;

/**
 * Representa un ítem del menú.
 */
public class MenuItem {
    private String nombre;
    private String descripcion;
    private String categoria; // "entrada", "plato principal", "postre", etc.
    private double precio;
    private boolean popular;
    private String imagen;
    
    public MenuItem() {
        this.popular = false;
    }
    
    public MenuItem(String nombre, String descripcion, String categoria) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.popular = false;
    }
    
    public MenuItem(String nombre, String descripcion, String categoria, double precio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.precio = precio;
        this.popular = false;
    }
    
    public MenuItem(String nombre, String descripcion, String categoria, double precio, boolean popular, String imagen) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
        this.precio = precio;
        this.popular = popular;
        this.imagen = imagen;
    }

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
}
