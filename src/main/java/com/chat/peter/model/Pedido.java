package com.chat.peter.model;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Representa un pedido realizado por un cliente.
 * Ahora incluye soporte para micropedidos, domicilios y pagos.
 */
@Document(collection = "pedidos")
public class Pedido {
    @Id
    private String id;
    private String clienteNombre;
    private String clienteId;
    private int mesa;
    private List<PedidoItem> items;
    private double total;
    private EstadoPedido estado;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private String observaciones;
    
    // Nuevas propiedades para las funcionalidades extendidas
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private TipoPedido tipoPedido;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private TipoEntrega tipoEntrega;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Direccion direccionEntrega;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Pago pago;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private double costoEnvio;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private double descuentoMicropedido;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime tiempoEstimadoEntrega;
    
    // Propiedades específicas para cocina
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private LocalDateTime fechaInicio; // Cuando se inició la preparación
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String cocineroAsignado; // ID o nombre del cocinero asignado
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Integer tiempoEstimado; // Tiempo estimado de preparación en minutos
    
    public Pedido() {
        this.items = new ArrayList<>();
        this.estado = EstadoPedido.PENDIENTE;
        this.fechaCreacion = LocalDateTime.now();
        this.fechaActualizacion = LocalDateTime.now();
        // Valores por defecto para nuevas propiedades
        this.tipoPedido = TipoPedido.NORMAL;
        this.tipoEntrega = TipoEntrega.PRESENCIAL;
        this.costoEnvio = 0.0;
        this.descuentoMicropedido = 0.0;
    }
    
    /**
     * Calcula el total del pedido incluyendo descuentos y costos de envío
     */
    public void calcularTotal() {
        double subtotal = items.stream()
            .mapToDouble(item -> item.getPrecio() * item.getCantidad())
            .sum();
        
        // Aplicar descuento de micropedido si corresponde
        subtotal -= descuentoMicropedido;
        
        // Agregar costo de envío si es domicilio
        if (tipoEntrega == TipoEntrega.DOMICILIO) {
            subtotal += costoEnvio;
        }
        
        this.total = Math.max(0, subtotal); // Evitar totales negativos
    }
    
    /**
     * Verifica si el pedido es elegible para ser micropedido
     * @return true si tiene 3 items o menos
     */
    public boolean esElegibleParaMicropedido() {
        return items != null && items.size() <= 3;
    }
    
    /**
     * Aplica las características de un micropedido
     * @param porcentajeDescuento Porcentaje de descuento a aplicar (ej: 10.0 para 10%)
     */
    public void convertirAMicropedido(double porcentajeDescuento) {
        if (esElegibleParaMicropedido()) {
            this.tipoPedido = TipoPedido.MICROPEDIDO;
            double subtotal = items.stream()
                .mapToDouble(item -> item.getPrecio() * item.getCantidad())
                .sum();
            this.descuentoMicropedido = subtotal * (porcentajeDescuento / 100.0);
            calcularTotal();
        }
    }
    
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
    
    public String getClienteId() {
        return clienteId;
    }

    public void setClienteId(String clienteId) {
        this.clienteId = clienteId;
    }

    public int getMesa() {
        return mesa;
    }

    public void setMesa(int mesa) {
        this.mesa = mesa;
    }

    public List<PedidoItem> getItems() {
        return items;
    }

    public void setItems(List<PedidoItem> items) {
        this.items = items;
        calcularTotal();
    }
    
    public void addItem(PedidoItem item) {
        this.items.add(item);
        calcularTotal();
    }

    public double getTotal() {
        return total;
    }

    public EstadoPedido getEstado() {
        return estado;
    }

    public void setEstado(EstadoPedido estado) {
        this.estado = estado;
        this.fechaActualizacion = LocalDateTime.now();
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    public String getObservaciones() {
        return observaciones;
    }    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    // Getters y Setters para las nuevas propiedades
    
    public TipoPedido getTipoPedido() {
        return tipoPedido;
    }

    public void setTipoPedido(TipoPedido tipoPedido) {
        this.tipoPedido = tipoPedido;
    }

    public TipoEntrega getTipoEntrega() {
        return tipoEntrega;
    }

    public void setTipoEntrega(TipoEntrega tipoEntrega) {
        this.tipoEntrega = tipoEntrega;
    }

    public Direccion getDireccionEntrega() {
        return direccionEntrega;
    }

    public void setDireccionEntrega(Direccion direccionEntrega) {
        this.direccionEntrega = direccionEntrega;
    }

    public Pago getPago() {
        return pago;
    }

    public void setPago(Pago pago) {
        this.pago = pago;
    }

    public double getCostoEnvio() {
        return costoEnvio;
    }

    public void setCostoEnvio(double costoEnvio) {
        this.costoEnvio = costoEnvio;
        calcularTotal(); // Recalcular total cuando cambia el costo de envío
    }

    public double getDescuentoMicropedido() {
        return descuentoMicropedido;
    }

    public void setDescuentoMicropedido(double descuentoMicropedido) {
        this.descuentoMicropedido = descuentoMicropedido;
        calcularTotal(); // Recalcular total cuando cambia el descuento
    }

    public LocalDateTime getTiempoEstimadoEntrega() {
        return tiempoEstimadoEntrega;
    }

    public void setTiempoEstimadoEntrega(LocalDateTime tiempoEstimadoEntrega) {
        this.tiempoEstimadoEntrega = tiempoEstimadoEntrega;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public String getCocineroAsignado() {
        return cocineroAsignado;
    }

    public void setCocineroAsignado(String cocineroAsignado) {
        this.cocineroAsignado = cocineroAsignado;
    }

    public Integer getTiempoEstimado() {
        return tiempoEstimado;
    }

    public void setTiempoEstimado(Integer tiempoEstimado) {
        this.tiempoEstimado = tiempoEstimado;
    }
}
