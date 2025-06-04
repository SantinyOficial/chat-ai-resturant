package com.chat.peter.controller;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.service.MicropedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la gestión de micropedidos.
 * Expone endpoints para crear y gestionar pedidos pequeños con beneficios especiales.
 */
@RestController
@RequestMapping("/api/micropedidos")
@CrossOrigin(origins = "http://localhost:4200")
public class MicropedidoController {
    
    @Autowired
    private MicropedidoService micropedidoService;
    
    /**
     * Valida si un pedido puede ser procesado como micropedido
     * @param pedido Datos del pedido a validar
     * @return Respuesta con la validación
     */
    @PostMapping("/validar")
    public ResponseEntity<Map<String, Object>> validarMicropedido(@RequestBody Pedido pedido) {
        try {
            boolean esValido = micropedidoService.esValidoParaMicropedido(pedido);
            
            if (esValido) {
                return ResponseEntity.ok(Map.of(
                    "valido", true,
                    "mensaje", "El pedido es elegible para micropedido",
                    "descuento", 15.0,
                    "tiempoEstimado", 5
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "valido", false,
                    "mensaje", "El pedido no cumple los criterios para micropedido. Máximo 3 items de productos elegibles.",
                    "razon", "ITEMS_EXCEDIDOS"
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "valido", false,
                "mensaje", "Error al validar el pedido: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Crea un nuevo micropedido
     * @param pedido Datos del micropedido
     * @return El micropedido creado
     */
    @PostMapping("/crear")
    public ResponseEntity<Map<String, Object>> crearMicropedido(@RequestBody Pedido pedido) {
        try {
            Pedido micropedido = micropedidoService.crearMicropedido(pedido);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "mensaje", "Micropedido creado exitosamente",
                "pedido", micropedido,
                "descuentoAplicado", micropedido.getDescuentoMicropedido(),
                "tiempoEstimado", micropedido.getTiempoEstimadoEntrega()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "mensaje", "Error interno al crear el micropedido"
            ));
        }
    }
    
    /**
     * Obtiene todos los micropedidos pendientes
     * @return Lista de micropedidos pendientes
     */
    @GetMapping("/pendientes")
    public ResponseEntity<List<Pedido>> obtenerMicropedidosPendientes() {
        try {
            List<Pedido> micropedidos = micropedidoService.obtenerMicropedidosPendientes();
            return ResponseEntity.ok(micropedidos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Actualiza el estado de un micropedido
     * @param id ID del micropedido
     * @param estado Nuevo estado
     * @return El micropedido actualizado
     */
    @PutMapping("/{id}/estado")
    public ResponseEntity<Map<String, Object>> actualizarEstado(
            @PathVariable String id, 
            @RequestBody Map<String, String> request) {
        try {
            String estadoStr = request.get("estado");
            EstadoPedido nuevoEstado = EstadoPedido.valueOf(estadoStr);
            
            Pedido micropedidoActualizado = micropedidoService.actualizarEstadoMicropedido(id, nuevoEstado);
            
            if (micropedidoActualizado != null) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "mensaje", "Estado del micropedido actualizado",
                    "pedido", micropedidoActualizado
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "mensaje", "Error al actualizar el estado"
            ));
        }
    }
    
    /**
     * Obtiene estadísticas de micropedidos
     * @return Estadísticas detalladas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<MicropedidoService.MicropedidoStats> obtenerEstadisticas() {
        try {
            MicropedidoService.MicropedidoStats stats = micropedidoService.obtenerEstadisticas();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Obtiene información sobre los beneficios de los micropedidos
     * @return Información de beneficios y elegibilidad
     */
    @GetMapping("/beneficios")
    public ResponseEntity<Map<String, Object>> obtenerBeneficios() {
        return ResponseEntity.ok(Map.of(
            "descuentoPorcentaje", 15.0,
            "tiempoPreparacion", 5,
            "maxItems", 3,
            "productosElegibles", List.of(
                "Bebidas (Agua, Gaseosas, Jugos)",
                "Snacks (Empanadas, Galletas)",
                "Café y Té",
                "Frutas y Yogurt",
                "Cereales y Granola"
            ),
            "ventajas", List.of(
                "15% de descuento automático",
                "Preparación en 5 minutos",
                "Prioridad en la cocina",
                "Proceso simplificado"
            )
        ));
    }
}
