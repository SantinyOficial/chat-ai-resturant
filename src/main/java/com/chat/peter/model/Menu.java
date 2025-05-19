package com.chat.peter.model;

import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Representa un menú del restaurante.
 */
@Document(collection = "menus")
public class Menu {
    @Id
    private String id;
    private String nombre;
    private String descripcion;
    private String tipo; // "diario", "ejecutivo", "especial", etc.
    private boolean activo;
    private List<MenuItem> items;
    private double precio;
    
    public Menu() {
        this.items = new ArrayList<>();
        this.activo = true;
    }
    
    public Menu(String nombre, String descripcion, String tipo, double precio) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.precio = precio;
        this.items = new ArrayList<>();
        this.activo = true;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public List<MenuItem> getItems() {
        return items;
    }

    public void setItems(List<MenuItem> items) {
        this.items = items;
    }
    
    public void addItem(MenuItem item) {
        this.items.add(item);
    }
    
    public double getPrecio() {
        return precio;
    }
    
    public void setPrecio(double precio) {
        this.precio = precio;
    }
}
