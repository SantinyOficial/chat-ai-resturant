package com.chat.peter.model;

/**
 * Representa un ítem del menú.
 */
public class MenuItem {
    private String nombre;
    private String descripcion;
    private String categoria; // "entrada", "plato principal", "postre", etc.
    
    public MenuItem() {
    }
    
    public MenuItem(String nombre, String descripcion, String categoria) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.categoria = categoria;
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
