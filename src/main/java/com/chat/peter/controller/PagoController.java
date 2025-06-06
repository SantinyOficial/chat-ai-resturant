package com.chat.peter.controller;

import com.chat.peter.model.MetodoPago;
import com.chat.peter.model.Pago;
import com.chat.peter.service.PagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;

/**
 * Controlador REST para la gestión de pagos simulados.
 * Maneja el procesamiento de diferentes métodos de pago de forma ficticia.
 */
@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "http://localhost:4200")
public class PagoController {
    
    @Autowired
    private PagoService pagoService;
    
    /**
     * Obtiene los métodos de pago disponibles
     * @return Lista de métodos de pago con información detallada
     */
    @GetMapping("/metodos-disponibles")
    public ResponseEntity<List<PagoService.MetodoPagoInfo>> obtenerMetodosPago() {
        try {
            List<PagoService.MetodoPagoInfo> metodos = pagoService.obtenerMetodosPagoDisponibles();
            return ResponseEntity.ok(metodos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Procesa un pago de forma asíncrona
     * @param request Datos del pago
     * @return Resultado del procesamiento
     */
    @PostMapping("/procesar")
    public CompletableFuture<ResponseEntity<Map<String, Object>>> procesarPago(@RequestBody Map<String, Object> request) {
        try {
            String pedidoId = (String) request.get("pedidoId");
            String metodoPagoStr = (String) request.get("metodoPago");
              if (pedidoId == null || metodoPagoStr == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("mensaje", "pedidoId y metodoPago son requeridos");
                return CompletableFuture.completedFuture(
                    ResponseEntity.badRequest().body(response)
                );            }
            
            MetodoPago metodoPago = MetodoPago.valueOf(metodoPagoStr);
            
            // Construir datos de pago desde el request
            Pago pago = construirPago(request);
            pago.setMetodoPago(metodoPago); // Asegurar que el método de pago esté configurado
            Long pedidoIdLong = Long.valueOf(pedidoId);
            
            return pagoService.procesarPago(pago, pedidoIdLong)
                .thenApply(resultado -> {
                    if (resultado.isExitoso()) {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("mensaje", resultado.getMensaje());
                        response.put("pago", resultado.getPago());
                        response.put("codigoTransaccion", resultado.getPago().getCodigoTransaccion());
                        response.put("referencia", resultado.getPago().getReferenciaPago());
                        return ResponseEntity.ok(response);
                    } else {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("mensaje", resultado.getMensaje());
                        response.put("codigoError", "PAGO_FALLIDO");
                        return ResponseEntity.ok(response);
                    }
                })
                .exceptionally(ex -> {
                    Map<String, Object> response = new HashMap<>();
                    response.put("success", false);
                    response.put("mensaje", "Error interno en el procesamiento del pago");
                    return ResponseEntity.internalServerError().body(response);
                });
                  } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("mensaje", "Método de pago inválido: " + e.getMessage());
            return CompletableFuture.completedFuture(
                ResponseEntity.badRequest().body(response)
            );
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("mensaje", "Error al iniciar el procesamiento del pago");
            return CompletableFuture.completedFuture(
                ResponseEntity.internalServerError().body(response)
            );
        }
    }
    
    /**
     * Consulta el estado de un pago
     * @param pedidoId ID del pedido
     * @return Estado del pago
     */    @GetMapping("/estado/{pedidoId}")
    public ResponseEntity<Map<String, Object>> consultarEstadoPago(@PathVariable String pedidoId) {
        try {
            Pago pago = pagoService.consultarPago(pedidoId);
            if (pago != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("found", true);
                response.put("pago", pago);
                response.put("estado", pago.getEstado());
                response.put("metodoPago", pago.getMetodoPago());
                response.put("monto", pago.getMonto());
                response.put("codigoTransaccion", pago.getCodigoTransaccion());
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("found", false);
                response.put("mensaje", "No se encontró información de pago para este pedido");
                return ResponseEntity.ok(response);
            }
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("found", false);
            response.put("mensaje", "Error al consultar el estado del pago");
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Genera un código QR para métodos de pago que lo requieren
     * @param request Datos para generar QR
     * @return Información del código QR
     */    @PostMapping("/generar-qr")
    public ResponseEntity<Map<String, Object>> generarCodigoQR(@RequestBody Map<String, Object> request) {
        try {
            String metodoPagoStr = (String) request.get("metodoPago");
            Double monto = ((Number) request.get("monto")).doubleValue();
            String pedidoId = (String) request.get("pedidoId");
            
            MetodoPago metodoPago = MetodoPago.valueOf(metodoPagoStr);
            String codigoQR = pagoService.generarCodigoQR(metodoPago, monto, pedidoId);
            
            if (codigoQR != null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("codigoQR", codigoQR);
                response.put("instrucciones", obtenerInstruccionesQR(metodoPago));
                response.put("vigencia", 300); // 5 minutos en segundos
                response.put("metodoPago", metodoPago);
                return ResponseEntity.ok(response);
            } else {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("mensaje", "El método de pago seleccionado no requiere código QR");
                return ResponseEntity.badRequest().body(response);
            }
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("mensaje", "Error al generar código QR: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Simula la validación de datos de pago
     * @param request Datos a validar
     * @return Resultado de la validación
     */
    @PostMapping("/validar-datos")
    public ResponseEntity<Map<String, Object>> validarDatosPago(@RequestBody Map<String, Object> request) {        try {
            String metodoPagoStr = (String) request.get("metodoPago");
            MetodoPago metodoPago = MetodoPago.valueOf(metodoPagoStr);
            
            Map<String, String> errores = validarDatosSegunMetodo(metodoPago, request);
            
            Map<String, Object> response = new HashMap<>();
            response.put("valido", errores.isEmpty());
            response.put("errores", errores);
            response.put("mensaje", errores.isEmpty() ? 
                "Datos válidos para " + metodoPago.name() : 
                "Se encontraron errores en los datos");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("valido", false);
            response.put("mensaje", "Error en la validación: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Obtiene información específica de un método de pago
     * @param metodoPago Método de pago a consultar
     * @return Información detallada del método
     */    @GetMapping("/info/{metodoPago}")
    public ResponseEntity<Map<String, Object>> obtenerInfoMetodoPago(@PathVariable String metodoPago) {
        try {
            MetodoPago metodo = MetodoPago.valueOf(metodoPago);
            Map<String, Object> response = new HashMap<>();
            response.put("metodoPago", metodo);
            response.put("nombre", obtenerNombreMetodo(metodo));
            response.put("descripcion", obtenerDescripcionMetodo(metodo));
            response.put("requiereQR", metodo == MetodoPago.NEQUI || metodo == MetodoPago.DAVIPLATA);
            response.put("camposRequeridos", obtenerCamposRequeridos(metodo));
            response.put("tiempoProcesamiento", "2-8 segundos");
            response.put("comision", 0.0);
            return ResponseEntity.ok(response);
            
        } catch (IllegalArgumentException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("error", "Método de pago no válido");
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // Métodos auxiliares privados
    
    private Pago construirPago(Map<String, Object> request) {
        Pago pago = new Pago();
        
        // Datos básicos
        if (request.containsKey("pedidoId")) {
            pago.setPedidoId((String) request.get("pedidoId"));
        }
        if (request.containsKey("metodoPago")) {
            String metodoPagoStr = (String) request.get("metodoPago");
            pago.setMetodoPago(MetodoPago.valueOf(metodoPagoStr));
        }
        if (request.containsKey("monto")) {
            Double monto = ((Number) request.get("monto")).doubleValue();
            pago.setMonto(monto);
        }
        
        // Datos específicos de tarjeta
        if (request.containsKey("numeroTarjeta")) {
            pago.setNumeroTarjeta((String) request.get("numeroTarjeta"));
        }
        if (request.containsKey("cvv")) {
            pago.setCvv((String) request.get("cvv"));
        }
        if (request.containsKey("fechaVencimiento")) {
            pago.setFechaVencimiento((String) request.get("fechaVencimiento"));
        }
        if (request.containsKey("nombreTitular")) {
            pago.setNombreTarjeta((String) request.get("nombreTitular"));
        }
        
        // Datos específicos de métodos móviles
        if (request.containsKey("telefono")) {
            String metodoPagoStr = (String) request.get("metodoPago");
            if ("NEQUI".equals(metodoPagoStr)) {
                pago.setTelefonoNequi((String) request.get("telefono"));
            } else if ("DAVIPLATA".equals(metodoPagoStr)) {
                pago.setTelefonoDaviplata((String) request.get("telefono"));
            }
        }
        
        // Datos específicos de PSE
        if (request.containsKey("banco")) {
            pago.setBancoPSE((String) request.get("banco"));
        }
        if (request.containsKey("tipoDocumento")) {
            pago.setTipoPersona((String) request.get("tipoDocumento"));
        }
        if (request.containsKey("numeroDocumento")) {
            pago.setNumeroDocumento((String) request.get("numeroDocumento"));
        }
        
        return pago;
    }
    
    private String obtenerInstruccionesQR(MetodoPago metodoPago) {
        return switch (metodoPago) {
            case NEQUI -> "Escanea el código QR desde tu app Nequi para completar el pago";
            case DAVIPLATA -> "Usa tu app Daviplata para escanear y pagar";
            default -> "Escanea el código QR con la aplicación correspondiente";
        };
    }
    
    private Map<String, String> validarDatosSegunMetodo(MetodoPago metodoPago, Map<String, Object> request) {
        Map<String, String> errores = new HashMap<>();
        
        switch (metodoPago) {
            case EFECTIVO:
                // El efectivo no requiere validación de datos adicionales
                break;
                
            case TARJETA:
                String numeroTarjeta = (String) request.get("numeroTarjeta");
                if (numeroTarjeta == null || numeroTarjeta.length() < 16) {
                    errores.put("numeroTarjeta", "Número de tarjeta debe tener al menos 16 dígitos");
                }
                
                String cvv = (String) request.get("cvv");
                if (cvv == null || cvv.length() != 3) {
                    errores.put("cvv", "CVV debe tener 3 dígitos");
                }
                
                String fechaVencimiento = (String) request.get("fechaVencimiento");
                if (fechaVencimiento == null || fechaVencimiento.trim().isEmpty()) {
                    errores.put("fechaVencimiento", "Fecha de vencimiento es requerida");
                }
                
                String nombreTitular = (String) request.get("nombreTitular");
                if (nombreTitular == null || nombreTitular.trim().isEmpty()) {
                    errores.put("nombreTitular", "Nombre del titular es requerido");
                }
                break;
                
            case NEQUI:
            case DAVIPLATA:
                String telefono = (String) request.get("telefono");
                if (telefono == null || telefono.length() != 10) {
                    errores.put("telefono", "Número de teléfono debe tener 10 dígitos");
                }
                break;
                
            case PSE:
                if (request.get("banco") == null) {
                    errores.put("banco", "Banco es requerido para PSE");
                }
                if (request.get("tipoDocumento") == null) {
                    errores.put("tipoDocumento", "Tipo de documento es requerido");
                }
                if (request.get("numeroDocumento") == null) {
                    errores.put("numeroDocumento", "Número de documento es requerido");
                }
                break;
                
            default:
                errores.put("metodoPago", "Método de pago no soportado: " + metodoPago);
                break;
        }
        
        return errores;
    }
    
    private String obtenerNombreMetodo(MetodoPago metodo) {
        return switch (metodo) {
            case EFECTIVO -> "Efectivo";
            case TARJETA -> "Tarjeta de Crédito/Débito";
            case NEQUI -> "Nequi";
            case PSE -> "PSE";
            case DAVIPLATA -> "Daviplata";
        };
    }
    
    private String obtenerDescripcionMetodo(MetodoPago metodo) {
        return switch (metodo) {
            case EFECTIVO -> "Pago en efectivo al momento de la entrega";
            case TARJETA -> "Pago seguro con tarjeta de crédito o débito";
            case NEQUI -> "Pago rápido y seguro desde tu celular";
            case PSE -> "Débito directo desde tu cuenta bancaria";
            case DAVIPLATA -> "Monedero digital del Banco Davivienda";
        };
    }
    
    private List<String> obtenerCamposRequeridos(MetodoPago metodo) {
        return switch (metodo) {
            case EFECTIVO -> List.of();
            case TARJETA -> List.of("numeroTarjeta", "cvv", "fechaVencimiento", "nombreTitular");
            case NEQUI, DAVIPLATA -> List.of("telefono");
            case PSE -> List.of("banco", "tipoDocumento", "numeroDocumento");
        };
    }
}
