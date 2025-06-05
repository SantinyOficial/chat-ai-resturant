package com.chat.peter.dto;

import com.chat.peter.model.EstadoPedido;
import com.chat.peter.model.EstadoPagoPedido;
import java.time.LocalDateTime;

public class EstadoSincronizadoDto {
    private String pedidoId;
    private EstadoPedido estadoPedido;
    private EstadoPagoPedido estadoPago;
    private LocalDateTime ultimaActualizacion;
    private Integer mesa;

    // Constructor por defecto
    public EstadoSincronizadoDto() {}

    // Constructor completo
    public EstadoSincronizadoDto(String pedidoId, EstadoPedido estadoPedido, 
                                EstadoPagoPedido estadoPago, LocalDateTime ultimaActualizacion, 
                                Integer mesa) {
        this.pedidoId = pedidoId;
        this.estadoPedido = estadoPedido;
        this.estadoPago = estadoPago;
        this.ultimaActualizacion = ultimaActualizacion;
        this.mesa = mesa;
    }

    // Getters y Setters
    public String getPedidoId() {
        return pedidoId;
    }

    public void setPedidoId(String pedidoId) {
        this.pedidoId = pedidoId;
    }

    public EstadoPedido getEstadoPedido() {
        return estadoPedido;
    }

    public void setEstadoPedido(EstadoPedido estadoPedido) {
        this.estadoPedido = estadoPedido;
    }

    public EstadoPagoPedido getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(EstadoPagoPedido estadoPago) {
        this.estadoPago = estadoPago;
    }

    public LocalDateTime getUltimaActualizacion() {
        return ultimaActualizacion;
    }

    public void setUltimaActualizacion(LocalDateTime ultimaActualizacion) {
        this.ultimaActualizacion = ultimaActualizacion;
    }

    public Integer getMesa() {
        return mesa;
    }

    public void setMesa(Integer mesa) {
        this.mesa = mesa;
    }

    @Override
    public String toString() {
        return "EstadoSincronizadoDto{" +
                "pedidoId='" + pedidoId + '\'' +
                ", estadoPedido=" + estadoPedido +
                ", estadoPago=" + estadoPago +
                ", ultimaActualizacion=" + ultimaActualizacion +
                ", mesa=" + mesa +
                '}';
    }
}
