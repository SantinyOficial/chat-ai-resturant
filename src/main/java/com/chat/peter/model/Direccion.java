package com.chat.peter.model;

/**
 * Representa una dirección para entrega a domicilio.
 * Contiene toda la información necesaria para ubicar al cliente
 * y calcular costos y tiempos de entrega.
 */
public class Direccion {
    
    private String calle;
    private String numero;
    private String barrio;
    private String ciudad;
    private String departamento;
    private String referencia;
    private String telefono;
    private String nombreContacto;
    
    // Constructor por defecto
    public Direccion() {}
    
    /**
     * Constructor con parámetros principales
     * @param calle Nombre de la calle principal
     * @param numero Número de la dirección
     * @param barrio Barrio o localidad
     * @param ciudad Ciudad de entrega
     */
    public Direccion(String calle, String numero, String barrio, String ciudad) {
        this.calle = calle;
        this.numero = numero;
        this.barrio = barrio;
        this.ciudad = ciudad;
    }
    
    /**
     * Obtiene la dirección completa formateada para mostrar
     * @return String con la dirección completa
     */
    public String getDireccionCompleta() {
        StringBuilder direccion = new StringBuilder();
        if (calle != null) direccion.append(calle);
        if (numero != null) direccion.append(" #").append(numero);
        if (barrio != null) direccion.append(", ").append(barrio);
        if (ciudad != null) direccion.append(", ").append(ciudad);
        return direccion.toString();
    }
    
    // Getters y Setters
    public String getCalle() {
        return calle;
    }

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public String getNumero() {
        return numero;
    }

    public void setNumero(String numero) {
        this.numero = numero;
    }

    public String getBarrio() {
        return barrio;
    }

    public void setBarrio(String barrio) {
        this.barrio = barrio;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getDepartamento() {
        return departamento;
    }

    public void setDepartamento(String departamento) {
        this.departamento = departamento;
    }

    public String getReferencia() {
        return referencia;
    }

    public void setReferencia(String referencia) {
        this.referencia = referencia;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getNombreContacto() {
        return nombreContacto;
    }

    public void setNombreContacto(String nombreContacto) {
        this.nombreContacto = nombreContacto;
    }
}
