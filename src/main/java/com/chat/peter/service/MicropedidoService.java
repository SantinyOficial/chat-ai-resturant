package com.chat.peter.service;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.TipoPedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Servicio especializado para la gestión de micropedidos.
 * Maneja la lógica específica para pedidos pequeños con beneficios especiales.
 */
@Service
public class MicropedidoService {
    
    private static final double DESCUENTO_MICROPEDIDO = 15.0; // 15% de descuento
    private static final int TIEMPO_PREPARACION_MINUTOS = 5; // 5 minutos para micropedidos
    private static final int MAX_ITEMS_MICROPEDIDO = 3;
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    /**
     * Valida si un pedido puede ser procesado como micropedido
     * @param pedido El pedido a validar
     * @return true si cumple los criterios de micropedido
     */
    public boolean esValidoParaMicropedido(Pedido pedido) {
        if (pedido == null || pedido.getItems() == null) {
            return false;
        }
        
        // Validar número máximo de items
        if (pedido.getItems().size() > MAX_ITEMS_MICROPEDIDO) {
            return false;
        }
        
        // Validar que todos los items sean elegibles para micropedido
        // (En una implementación real, verificaríamos productos específicos)
        return pedido.getItems().stream()
            .allMatch(item -> esProductoElegible(item.getNombre()));
    }
    
    /**
     * Crea un micropedido con descuentos y tiempos optimizados
     * @param pedido El pedido base
     * @return El micropedido procesado
     * @throws IllegalArgumentException si el pedido no es válido para micropedido
     */
    public Pedido crearMicropedido(Pedido pedido) {
        if (!esValidoParaMicropedido(pedido)) {
            throw new IllegalArgumentException(
                "El pedido no cumple los criterios para ser un micropedido. " +
                "Máximo " + MAX_ITEMS_MICROPEDIDO + " items de productos elegibles."
            );
        }
        
        // Configurar como micropedido
        pedido.setTipoPedido(TipoPedido.MICROPEDIDO);
        
        // Aplicar descuento
        pedido.convertirAMicropedido(DESCUENTO_MICROPEDIDO);
        
        // Establecer tiempo de entrega optimizado
        LocalDateTime tiempoEntrega = LocalDateTime.now().plusMinutes(TIEMPO_PREPARACION_MINUTOS);
        pedido.setTiempoEstimadoEntrega(tiempoEntrega);
        
        // Establecer estado específico para micropedidos
        pedido.setEstado(EstadoPedido.PENDIENTE);
        
        return pedidoRepository.save(pedido);
    }
    
    /**
     * Obtiene todos los micropedidos pendientes
     * @return Lista de micropedidos pendientes
     */
    public List<Pedido> obtenerMicropedidosPendientes() {
        return pedidoRepository.findAll().stream()
            .filter(pedido -> pedido.getTipoPedido() == TipoPedido.MICROPEDIDO)
            .filter(pedido -> pedido.getEstado() == EstadoPedido.PENDIENTE || 
                            pedido.getEstado() == EstadoPedido.EN_PREPARACION)
            .toList();
    }
    
    /**
     * Actualiza el estado de un micropedido con tiempos optimizados
     * @param micropedidoId ID del micropedido
     * @param nuevoEstado Nuevo estado
     * @return El micropedido actualizado o null si no se encuentra
     */
    public Pedido actualizarEstadoMicropedido(String micropedidoId, EstadoPedido nuevoEstado) {
        Optional<Pedido> pedidoOpt = pedidoRepository.findById(micropedidoId);
        
        if (pedidoOpt.isPresent()) {
            Pedido pedido = pedidoOpt.get();
            
            // Verificar que sea un micropedido
            if (pedido.getTipoPedido() != TipoPedido.MICROPEDIDO) {
                throw new IllegalArgumentException("El pedido no es un micropedido");
            }
            
            pedido.setEstado(nuevoEstado);
            
            // Ajustar tiempo estimado según el nuevo estado
            if (nuevoEstado == EstadoPedido.EN_PREPARACION) {
                pedido.setTiempoEstimadoEntrega(LocalDateTime.now().plusMinutes(TIEMPO_PREPARACION_MINUTOS));
            } else if (nuevoEstado == EstadoPedido.LISTO) {
                pedido.setTiempoEstimadoEntrega(LocalDateTime.now());
            }
            
            return pedidoRepository.save(pedido);
        }
        
        return null;
    }
    
    /**
     * Obtiene estadísticas de micropedidos
     * @return Información estadística de micropedidos
     */
    public MicropedidoStats obtenerEstadisticas() {
        List<Pedido> todosMicropedidos = pedidoRepository.findAll().stream()
            .filter(pedido -> pedido.getTipoPedido() == TipoPedido.MICROPEDIDO)
            .toList();
        
        long pendientes = todosMicropedidos.stream()
            .filter(p -> p.getEstado() == EstadoPedido.PENDIENTE)
            .count();
        
        long enPreparacion = todosMicropedidos.stream()
            .filter(p -> p.getEstado() == EstadoPedido.EN_PREPARACION)
            .count();
        
        long completados = todosMicropedidos.stream()
            .filter(p -> p.getEstado() == EstadoPedido.ENTREGADO)
            .count();
        
        double tiempoPromedioPreparacion = TIEMPO_PREPARACION_MINUTOS;
        double ahorroPromedio = todosMicropedidos.stream()
            .mapToDouble(Pedido::getDescuentoMicropedido)
            .average()
            .orElse(0.0);
        
        return new MicropedidoStats(
            todosMicropedidos.size(),
            pendientes,
            enPreparacion,
            completados,
            tiempoPromedioPreparacion,
            ahorroPromedio
        );
    }
    
    /**
     * Verifica si un producto es elegible para micropedidos
     * (En una implementación real, esto vendría de una base de datos)
     * @param nombreProducto Nombre del producto
     * @return true si es elegible
     */
    private boolean esProductoElegible(String nombreProducto) {
        // Lista simulada de productos elegibles para micropedidos
        String[] productosElegibles = {
            "Agua", "Gaseosa", "Jugo", "Café", "Té",
            "Empanada", "Sandwich", "Galletas", "Fruta",
            "Yogurt", "Granola", "Cereal"
        };
        
        return nombreProducto != null && 
               java.util.Arrays.stream(productosElegibles)
                   .anyMatch(producto -> nombreProducto.toLowerCase().contains(producto.toLowerCase()));
    }
    
    /**
     * Clase interna para estadísticas de micropedidos
     */
    public static class MicropedidoStats {
        private final int totalMicropedidos;
        private final long pendientes;
        private final long enPreparacion;
        private final long completados;
        private final double tiempoPromedioPreparacion;
        private final double ahorroPromedio;
        
        public MicropedidoStats(int total, long pendientes, long enPreparacion, 
                               long completados, double tiempoPromedio, double ahorro) {
            this.totalMicropedidos = total;
            this.pendientes = pendientes;
            this.enPreparacion = enPreparacion;
            this.completados = completados;
            this.tiempoPromedioPreparacion = tiempoPromedio;
            this.ahorroPromedio = ahorro;
        }
        
        // Getters
        public int getTotalMicropedidos() { return totalMicropedidos; }
        public long getPendientes() { return pendientes; }
        public long getEnPreparacion() { return enPreparacion; }
        public long getCompletados() { return completados; }
        public double getTiempoPromedioPreparacion() { return tiempoPromedioPreparacion; }
        public double getAhorroPromedio() { return ahorroPromedio; }
    }
}
