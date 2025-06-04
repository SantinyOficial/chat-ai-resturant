package com.chat.peter.controller;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.Direccion;
import com.chat.peter.service.DomicilioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controlador REST para la gestión de domicilios.
 * Maneja pedidos a domicilio, cálculo de costos y seguimiento simulado.
 */
@RestController
@RequestMapping("/api/domicilios")
@CrossOrigin(origins = "http://localhost:4200")
public class DomicilioController {
    
    @Autowired
    private DomicilioService domicilioService;
    
    /**
     * Calcula el costo de envío para una dirección específica
     * @param direccion Dirección de entrega
     * @return Información del costo y disponibilidad
     */
    @PostMapping("/calcular-costo")
    public ResponseEntity<Map<String, Object>> calcularCostoEnvio(@RequestBody Direccion direccion) {
        try {
            DomicilioService.CostoEnvio costoEnvio = domicilioService.calcularCostoEnvio(direccion);
            
            return ResponseEntity.ok(Map.of(
                "disponible", costoEnvio.isDisponible(),
                "costo", costoEnvio.getCosto(),
                "tiempoEntrega", costoEnvio.getTiempoEntrega(),
                "distancia", costoEnvio.getDistancia(),
                "mensaje", costoEnvio.getMensaje(),
                "direccionCompleta", direccion.getDireccionCompleta()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "disponible", false,
                "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "disponible", false,
                "mensaje", "Error al calcular el costo de envío"
            ));
        }
    }
    
    /**
     * Configura un pedido para entrega a domicilio
     * @param request Datos del pedido y dirección
     * @return Pedido configurado para domicilio
     */
    @PostMapping("/configurar-pedido")
    public ResponseEntity<Map<String, Object>> configurarPedidoDomicilio(@RequestBody Map<String, Object> request) {
        try {
            // Extraer pedido y dirección del request
            @SuppressWarnings("unchecked")
            Map<String, Object> pedidoData = (Map<String, Object>) request.get("pedido");
            @SuppressWarnings("unchecked")
            Map<String, Object> direccionData = (Map<String, Object>) request.get("direccion");
            
            if (pedidoData == null || direccionData == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "mensaje", "Pedido y dirección son requeridos"
                ));
            }
              // Construir objetos desde los datos
            String pedidoId = (String) pedidoData.get("id");
            Direccion direccion = construirDireccionDesdeMap(direccionData);
            
            DomicilioService.ResultadoDomicilio resultado = domicilioService.configurarPedidoDomicilio(pedidoId, direccion);
            
            if (resultado.isExitoso()) {
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "mensaje", "Pedido configurado para domicilio exitosamente",
                    "pedido", resultado.getPedido(),
                    "costoEnvio", resultado.getPedido().getCostoEnvio(),
                    "tiempoEstimado", resultado.getPedido().getTiempoEstimadoEntrega()
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "mensaje", resultado.getMensaje()
                ));
            }
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "mensaje", "Error al configurar el pedido para domicilio"
            ));
        }
    }
    
    /**
     * Obtiene todos los pedidos a domicilio pendientes
     * @return Lista de pedidos a domicilio en proceso
     */
    @GetMapping("/pedidos-pendientes")
    public ResponseEntity<List<Pedido>> obtenerPedidosDomicilioPendientes() {
        try {
            List<Pedido> pedidos = domicilioService.obtenerPedidosDomicilioPendientes();
            return ResponseEntity.ok(pedidos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Obtiene información de seguimiento de un pedido a domicilio
     * @param pedidoId ID del pedido
     * @return Información de seguimiento
     */
    @GetMapping("/seguimiento/{pedidoId}")
    public ResponseEntity<Map<String, Object>> obtenerSeguimiento(@PathVariable String pedidoId) {
        try {
            DomicilioService.SeguimientoDomicilio seguimiento = domicilioService.obtenerSeguimiento(pedidoId);
            
            return ResponseEntity.ok(Map.of(
                "pedidoId", seguimiento.getPedidoId(),
                "estado", seguimiento.getEstado(),                "domiciliario", Map.of(
                    "nombre", seguimiento.getNombreDomiciliario(),
                    "telefono", seguimiento.getTelefonoDomiciliario(),
                    "vehiculo", seguimiento.getVehiculo()
                ),
                "ubicacion", Map.of(
                    "latitud", seguimiento.getCoordenadas().getLatitud(),
                    "longitud", seguimiento.getCoordenadas().getLongitud(),
                    "descripcion", seguimiento.getUbicacionActual()
                ),
                "tiempoEstimado", seguimiento.getTiempoEstimadoEntrega(),
                "direccionDestino", seguimiento.getDireccionDestino()
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Error al obtener el seguimiento"
            ));
        }
    }
    
    /**
     * Actualiza la ubicación del domiciliario (simulado)
     * @param pedidoId ID del pedido
     * @return Información actualizada de seguimiento
     */
    @PutMapping("/actualizar-ubicacion/{pedidoId}")
    public ResponseEntity<Map<String, Object>> actualizarUbicacionDomiciliario(@PathVariable String pedidoId) {
        try {
            DomicilioService.SeguimientoDomicilio seguimiento = domicilioService.actualizarUbicacionDomiciliario(pedidoId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,                "seguimiento", Map.of(
                    "estado", seguimiento.getEstado(),
                    "ubicacion", Map.of(
                        "latitud", seguimiento.getCoordenadas().getLatitud(),
                        "longitud", seguimiento.getCoordenadas().getLongitud(),
                        "descripcion", seguimiento.getUbicacionActual()
                    ),
                    "tiempoEstimado", seguimiento.getTiempoEstimadoEntrega()
                ),
                "mensaje", "Ubicación actualizada exitosamente"
            ));
            
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "mensaje", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "mensaje", "Error al actualizar la ubicación"
            ));
        }
    }
    
    /**
     * Obtiene información sobre zonas de cobertura
     * @return Información de zonas disponibles
     */
    @GetMapping("/zonas-cobertura")
    public ResponseEntity<Map<String, Object>> obtenerZonasCobertura() {
        return ResponseEntity.ok(Map.of(
            "distanciaMaxima", 15.0,
            "costoBase", 3500.0,
            "costoPorKm", 800.0,
            "zonasDisponibles", List.of(
                Map.of("nombre", "El Poblado", "distancia", 2.5, "tiempoEstimado", 20),
                Map.of("nombre", "Laureles", "distancia", 3.8, "tiempoEstimado", 25),
                Map.of("nombre", "Envigado", "distancia", 5.2, "tiempoEstimado", 30),
                Map.of("nombre", "Bello", "distancia", 7.1, "tiempoEstimado", 35),
                Map.of("nombre", "Itagüí", "distancia", 8.5, "tiempoEstimado", 40)
            ),
            "horarioServicio", Map.of(
                "inicio", "08:00",
                "fin", "22:00",
                "disponible", true
            )
        ));
    }
    
    /**
     * Valida una dirección para domicilio
     * @param direccion Dirección a validar
     * @return Resultado de la validación
     */
    @PostMapping("/validar-direccion")
    public ResponseEntity<Map<String, Object>> validarDireccion(@RequestBody Direccion direccion) {
        try {
            if (direccion.getCalle() == null || direccion.getCalle().trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "valida", false,
                    "errores", List.of("Calle es requerida")
                ));
            }
            
            if (direccion.getBarrio() == null || direccion.getBarrio().trim().isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "valida", false,
                    "errores", List.of("Barrio es requerido")
                ));
            }
            
            if (direccion.getTelefono() == null || direccion.getTelefono().length() != 10) {
                return ResponseEntity.ok(Map.of(
                    "valida", false,
                    "errores", List.of("Teléfono debe tener 10 dígitos")
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "valida", true,
                "mensaje", "Dirección válida",
                "direccionCompleta", direccion.getDireccionCompleta()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "valida", false,
                "mensaje", "Error al validar la dirección"
            ));
        }
    }
    
    // Métodos auxiliares privados
    
    private Pedido construirPedidoDesdeMap(Map<String, Object> data) {
        Pedido pedido = new Pedido();
        
        if (data.containsKey("id")) {
            pedido.setId((String) data.get("id"));
        }
        if (data.containsKey("clienteNombre")) {
            pedido.setClienteNombre((String) data.get("clienteNombre"));
        }
        if (data.containsKey("clienteId")) {
            pedido.setClienteId((String) data.get("clienteId"));
        }
        if (data.containsKey("mesa")) {
            pedido.setMesa(((Number) data.get("mesa")).intValue());
        }
        if (data.containsKey("observaciones")) {
            pedido.setObservaciones((String) data.get("observaciones"));
        }
        
        return pedido;
    }
    
    private Direccion construirDireccionDesdeMap(Map<String, Object> data) {
        Direccion direccion = new Direccion();
        
        if (data.containsKey("calle")) {
            direccion.setCalle((String) data.get("calle"));
        }
        if (data.containsKey("numero")) {
            direccion.setNumero((String) data.get("numero"));
        }
        if (data.containsKey("barrio")) {
            direccion.setBarrio((String) data.get("barrio"));
        }
        if (data.containsKey("ciudad")) {
            direccion.setCiudad((String) data.get("ciudad"));
        }
        if (data.containsKey("departamento")) {
            direccion.setDepartamento((String) data.get("departamento"));
        }
        if (data.containsKey("referencia")) {
            direccion.setReferencia((String) data.get("referencia"));
        }
        if (data.containsKey("telefono")) {
            direccion.setTelefono((String) data.get("telefono"));
        }
        if (data.containsKey("nombreContacto")) {
            direccion.setNombreContacto((String) data.get("nombreContacto"));
        }
        
        return direccion;
    }
}
