package com.chat.peter.service;

import com.chat.peter.dto.EstadoSincronizadoDto;
import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.model.EstadoPagoPedido;
import com.chat.peter.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class EstadoSincronizacionService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    // Cache de estados de pago en memoria (en producción usaría Redis)
    private final Map<String, EstadoPagoPedido> estadosPago = new ConcurrentHashMap<>();
    private final Map<String, LocalDateTime> ultimasActualizaciones = new ConcurrentHashMap<>();
    
    /**
     * Actualizar estado completo de un pedido
     */
    public EstadoSincronizadoDto actualizarEstadoCompleto(String pedidoId, 
                                                         EstadoPedido estadoPedido, 
                                                         EstadoPagoPedido estadoPago) {
        // Actualizar estado de pago en caché
        if (estadoPago != null) {
            estadosPago.put(pedidoId, estadoPago);
        }
        
        // Actualizar estado del pedido en base de datos
        if (estadoPedido != null) {
            Pedido pedido = pedidoRepository.findById(pedidoId).orElse(null);
            if (pedido != null) {
                pedido.setEstado(estadoPedido);
                pedidoRepository.save(pedido);
            }
        }
        
        // Actualizar timestamp
        LocalDateTime ahora = LocalDateTime.now();
        ultimasActualizaciones.put(pedidoId, ahora);
        
        // Crear DTO de respuesta
        Pedido pedido = pedidoRepository.findById(pedidoId).orElse(null);
        EstadoSincronizadoDto estado = new EstadoSincronizadoDto();
        estado.setPedidoId(pedidoId);
        estado.setEstadoPedido(pedido != null ? pedido.getEstado() : EstadoPedido.PENDIENTE);
        estado.setEstadoPago(estadosPago.getOrDefault(pedidoId, EstadoPagoPedido.PENDIENTE_PAGO));
        estado.setUltimaActualizacion(ahora);
        estado.setMesa(pedido != null ? pedido.getMesa() : null);
        
        return estado;
    }
    
    /**
     * Obtener estado específico de un pedido
     */
    public EstadoSincronizadoDto obtenerEstado(String pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId).orElse(null);
        if (pedido == null) {
            return null;
        }
        
        EstadoSincronizadoDto estado = new EstadoSincronizadoDto();
        estado.setPedidoId(pedidoId);
        estado.setEstadoPedido(pedido.getEstado());        estado.setEstadoPago(estadosPago.getOrDefault(pedidoId, EstadoPagoPedido.PENDIENTE_PAGO));
        estado.setUltimaActualizacion(ultimasActualizaciones.getOrDefault(pedidoId, pedido.getFechaCreacion()));
        estado.setMesa(pedido.getMesa());
        
        return estado;
    }
    
    /**
     * Obtener cambios desde una fecha específica
     */
    public List<EstadoSincronizadoDto> obtenerCambiosDesde(LocalDateTime fecha) {
        return ultimasActualizaciones.entrySet().stream()
                .filter(entry -> entry.getValue().isAfter(fecha))
                .map(entry -> obtenerEstado(entry.getKey()))
                .filter(estado -> estado != null)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtener todos los estados completos
     */
    public List<EstadoSincronizadoDto> obtenerTodosLosEstados() {
        List<Pedido> todosPedidos = pedidoRepository.findAll();
        
        return todosPedidos.stream()
                .map(pedido -> {
                    EstadoSincronizadoDto estado = new EstadoSincronizadoDto();
                    estado.setPedidoId(pedido.getId());
                    estado.setEstadoPedido(pedido.getEstado());                    estado.setEstadoPago(estadosPago.getOrDefault(pedido.getId(), EstadoPagoPedido.PENDIENTE_PAGO));
                    estado.setUltimaActualizacion(ultimasActualizaciones.getOrDefault(pedido.getId(), pedido.getFechaCreacion()));
                    estado.setMesa(pedido.getMesa());
                    return estado;
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Actualizar solo estado de pago
     */
    public EstadoSincronizadoDto actualizarEstadoPago(String pedidoId, EstadoPagoPedido estadoPago) {
        return actualizarEstadoCompleto(pedidoId, null, estadoPago);
    }
    
    /**
     * Actualizar solo estado de pedido
     */
    public EstadoSincronizadoDto actualizarEstadoPedido(String pedidoId, EstadoPedido estadoPedido) {
        return actualizarEstadoCompleto(pedidoId, estadoPedido, null);
    }
    
    /**
     * Limpiar estados antiguos (limpieza de caché)
     */
    public void limpiarEstadosAntiguos() {
        LocalDateTime hace24Horas = LocalDateTime.now().minusHours(24);
        
        ultimasActualizaciones.entrySet().removeIf(entry -> 
            entry.getValue().isBefore(hace24Horas));
        
        // También limpiar estados de pago de pedidos que ya no existen
        estadosPago.entrySet().removeIf(entry -> 
            !pedidoRepository.existsById(entry.getKey()));
    }
}
