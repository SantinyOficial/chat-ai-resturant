package com.chat.peter.dto;

import java.util.List;

public class EstadisticasCocinaDTO {
    private Long pedidosPendientes;
    private Long pedidosEnPreparacion;
    private Long pedidosListos;
    private Long totalPedidosActivos;
    private Long totalPedidosHoy;
    private Double tiempoPromedioPreparacion;
    private Double eficienciaCocina;
    private Integer comandosVozHoy;
    private Integer comandosExitosos;

    // Constructor
    public EstadisticasCocinaDTO() {}

    public EstadisticasCocinaDTO(Long pedidosPendientes, Long pedidosEnPreparacion, Long totalPedidosHoy, 
                                Double tiempoPromedioPreparacion, Double eficienciaCocina, 
                                Integer comandosVozHoy, Integer comandosExitosos) {
        this.pedidosPendientes = pedidosPendientes;
        this.pedidosEnPreparacion = pedidosEnPreparacion;
        this.totalPedidosHoy = totalPedidosHoy;
        this.tiempoPromedioPreparacion = tiempoPromedioPreparacion;
        this.eficienciaCocina = eficienciaCocina;
        this.comandosVozHoy = comandosVozHoy;
        this.comandosExitosos = comandosExitosos;
    }

    // Getters y Setters
    public Long getPedidosPendientes() {
        return pedidosPendientes;
    }

    public void setPedidosPendientes(Long pedidosPendientes) {
        this.pedidosPendientes = pedidosPendientes;
    }

    public Long getPedidosEnPreparacion() {
        return pedidosEnPreparacion;
    }

    public void setPedidosEnPreparacion(Long pedidosEnPreparacion) {
        this.pedidosEnPreparacion = pedidosEnPreparacion;
    }

    public Long getPedidosListos() {
        return pedidosListos;
    }

    public void setPedidosListos(Long pedidosListos) {
        this.pedidosListos = pedidosListos;
    }

    public Long getTotalPedidosActivos() {
        return totalPedidosActivos;
    }

    public void setTotalPedidosActivos(Long totalPedidosActivos) {
        this.totalPedidosActivos = totalPedidosActivos;
    }

    public Long getTotalPedidosHoy() {
        return totalPedidosHoy;
    }

    public void setTotalPedidosHoy(Long totalPedidosHoy) {
        this.totalPedidosHoy = totalPedidosHoy;
    }

    public Double getTiempoPromedioPreparacion() {
        return tiempoPromedioPreparacion;
    }

    public void setTiempoPromedioPreparacion(Double tiempoPromedioPreparacion) {
        this.tiempoPromedioPreparacion = tiempoPromedioPreparacion;
    }

    public Double getEficienciaCocina() {
        return eficienciaCocina;
    }

    public void setEficienciaCocina(Double eficienciaCocina) {
        this.eficienciaCocina = eficienciaCocina;
    }

    public Integer getComandosVozHoy() {
        return comandosVozHoy;
    }

    public void setComandosVozHoy(Integer comandosVozHoy) {
        this.comandosVozHoy = comandosVozHoy;
    }

    public Integer getComandosExitosos() {
        return comandosExitosos;
    }

    public void setComandosExitosos(Integer comandosExitosos) {
        this.comandosExitosos = comandosExitosos;
    }
}
