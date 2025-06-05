package com.chat.peter.controller;

import com.chat.peter.service.CocinaService;
import com.chat.peter.service.CocinaAIService;
import com.chat.peter.dto.PedidoCocinaDTO;
import com.chat.peter.dto.EstadisticasCocinaDTO;
import com.chat.peter.model.EstadoPedido;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controlador REST para el módulo de cocina con comandos de voz.
 * Gestiona la interfaz especializada para la cocina y procesamiento de comandos de voz.
 */
@RestController
@RequestMapping("/api/cocina")
@CrossOrigin(origins = "http://localhost:4200")
public class CocinaController {
    
    @Autowired
    private CocinaService cocinaService;
    
    @Autowired
    private CocinaAIService cocinaAIService;
    
    /**
     * Obtiene todos los pedidos pendientes para mostrar en la cocina
     * @return Lista de pedidos pendientes y en preparación usando DTOs
     */
    @GetMapping("/pedidos-pendientes")
    public ResponseEntity<List<PedidoCocinaDTO>> obtenerPedidosPendientes() {
        try {
            List<PedidoCocinaDTO> pedidos = cocinaService.obtenerPedidosPendientes();
            return ResponseEntity.ok(pedidos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Procesa un comando de voz y ejecuta la acción correspondiente
     * @param request Datos del comando de voz
     * @return Resultado del procesamiento
     */
    @PostMapping("/comando-voz")
    public ResponseEntity<Map<String, Object>> procesarComandoVoz(@RequestBody Map<String, String> request) {        try {
            String comandoVoz = request.get("comando");
            if (comandoVoz == null || comandoVoz.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("mensaje", "Comando de voz requerido");
                return ResponseEntity.badRequest().body(response);
            }
            
            CocinaService.ResultadoComando resultado = cocinaService.procesarComandoVoz(comandoVoz);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", resultado.isExitoso());
            response.put("mensaje", resultado.getMensaje());
            response.put("pedido", resultado.getPedido());
            response.put("comandoOriginal", comandoVoz);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("mensaje", "Error al procesar el comando de voz: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
      
    /**
     * Obtiene comandos de voz sugeridos para la interfaz
     * @return Lista de comandos de ejemplo
     */    @GetMapping("/comandos-sugeridos")
    public ResponseEntity<Map<String, Object>> obtenerComandosSugeridos() {
        try {
            List<String> comandos = cocinaService.obtenerComandosSugeridos();
            
            Map<String, String> patrones = new HashMap<>();
            patrones.put("marcarListo", "Pedido [número/mesa] listo");
            patrones.put("iniciarPreparacion", "Empezar pedido [número/mesa]");
            patrones.put("cancelar", "Cancelar pedido [número/mesa]");
            patrones.put("consultar", "Estado pedido [número/mesa]");
            
            List<String> ejemplos = List.of(
                "Pedido mesa 5 listo",
                "Empezar pedido mesa 3",
                "Cancelar orden mesa 7",
                "Estado pedido mesa 2"
            );
            
            Map<String, Object> response = new HashMap<>();
            response.put("comandos", comandos);
            response.put("patrones", patrones);
            response.put("ejemplos", ejemplos);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Simula el reconocimiento de voz (para demostración)
     * @return Estado del reconocimiento de voz
     */    @GetMapping("/estado-reconocimiento")
    public ResponseEntity<Map<String, Object>> obtenerEstadoReconocimiento() {
        Map<String, Object> response = new HashMap<>();
        response.put("disponible", true);
        response.put("idioma", "es-ES");
        response.put("precision", 0.95);
        response.put("estado", "ESCUCHANDO");
        response.put("mensaje", "Listo para recibir comandos de voz");
        return ResponseEntity.ok(response);
    }
    
    /**
     * Simula iniciar/detener el reconocimiento de voz
     * @param request Configuración del reconocimiento
     * @return Estado actualizado
     */    @PostMapping("/reconocimiento")
    public ResponseEntity<Map<String, Object>> controlarReconocimiento(@RequestBody Map<String, Boolean> request) {
        try {
            boolean iniciar = request.getOrDefault("iniciar", false);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("estado", iniciar ? "INICIADO" : "DETENIDO");
            response.put("mensaje", iniciar ? "Reconocimiento de voz activado" : "Reconocimiento de voz desactivado");
            response.put("timestamp", System.currentTimeMillis());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("mensaje", "Error al controlar el reconocimiento de voz");
            return ResponseEntity.internalServerError().body(error);
        }
    }
      /**
     * Obtiene estadísticas de la cocina
     * @return Estadísticas de pedidos y eficiencia usando DTOs
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<EstadisticasCocinaDTO> obtenerEstadisticasCocina() {
        try {
            EstadisticasCocinaDTO estadisticas = cocinaService.obtenerEstadisticasCocina();
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Obtiene la configuración de la interfaz de cocina
     * @return Configuración personalizada para la cocina
     */    @GetMapping("/configuracion")
    public ResponseEntity<Map<String, Object>> obtenerConfiguracionCocina() {
        Map<String, Object> modoVoz = new HashMap<>();
        modoVoz.put("habilitado", true);
        modoVoz.put("volumenMinimo", 0.3);
        modoVoz.put("tiempoEspera", 3000);
        modoVoz.put("confirmarComandos", true);
        
        Map<String, Object> pantalla = new HashMap<>();
        pantalla.put("temaOscuro", true);
        pantalla.put("tamanotexto", "grande");
        pantalla.put("mostrarTimestamps", true);
        pantalla.put("autoActualizar", 30000);
        
        Map<String, Object> notificaciones = new HashMap<>();
        notificaciones.put("sonidoNuevoPedido", true);
        notificaciones.put("alertaTiempo", true);
        notificaciones.put("vibrarComandos", false);
        
        Map<String, Object> response = new HashMap<>();
        response.put("modoVoz", modoVoz);
        response.put("pantalla", pantalla);
        response.put("notificaciones", notificaciones);
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Obtiene pedidos por estado específico
     * @param estado Estado del pedido
     * @return Lista de pedidos filtrada por estado
     */
    @GetMapping("/pedidos-por-estado/{estado}")
    public ResponseEntity<List<PedidoCocinaDTO>> obtenerPedidosPorEstado(@PathVariable String estado) {
        try {
            EstadoPedido estadoPedido = EstadoPedido.valueOf(estado.toUpperCase());
            List<PedidoCocinaDTO> pedidos = cocinaService.obtenerPedidosPorEstado(estadoPedido);
            return ResponseEntity.ok(pedidos);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtiene todos los pedidos activos (no entregados ni cancelados)
     * @return Lista de pedidos activos
     */
    @GetMapping("/pedidos-activos")
    public ResponseEntity<List<PedidoCocinaDTO>> obtenerPedidosActivos() {
        try {
            List<PedidoCocinaDTO> pedidos = cocinaService.obtenerPedidosActivos();
            return ResponseEntity.ok(pedidos);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    /**
     * Procesa un comando de lenguaje natural usando AI
     * @param request Datos del comando de lenguaje natural
     * @return Resultado del procesamiento con IA
     */
    @PostMapping("/comando-natural")
    public ResponseEntity<Map<String, Object>> procesarComandoNatural(@RequestBody Map<String, String> request) {
        try {
            String comandoNatural = request.get("comando");
            if (comandoNatural == null || comandoNatural.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("mensaje", "Comando de lenguaje natural requerido");
                return ResponseEntity.badRequest().body(response);
            }            CocinaAIService.RespuestaAICocina respuestaAI = cocinaAIService.procesarComandoNatural(comandoNatural, null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", respuestaAI.getResultadoEjecucion().isExitoso());
            // Usar la respuesta natural del LLM como mensaje principal para el usuario
            response.put("mensaje", respuestaAI.getRespuestaUsuario());
            response.put("accion", respuestaAI.getAccion());
            response.put("mesa", respuestaAI.getParametros().get("mesa"));
            response.put("confianza", respuestaAI.getConfianza());
            // Mantener el resultado técnico por separado para debugging
            response.put("resultadoTecnico", respuestaAI.getResultadoEjecucion().getMensaje());
            response.put("comandoOriginal", comandoNatural);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("mensaje", "Error al procesar el comando con IA: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Obtiene la lista de cocineros disponibles
     * @return Lista de cocineros con su información y disponibilidad
     */
    @GetMapping("/cocineros")
    public ResponseEntity<List<Map<String, Object>>> obtenerCocinerosDisponibles() {
        try {
            // Simular datos de cocineros (en una implementación real vendría de base de datos)
            List<Map<String, Object>> cocineros = new ArrayList<>();
            
            Map<String, Object> cocinero1 = new HashMap<>();
            cocinero1.put("id", "COC001");
            cocinero1.put("nombre", "Carlos Mendoza");
            cocinero1.put("especialidad", "Platos principales");
            cocinero1.put("pedidosAsignados", 3);
            cocinero1.put("disponible", true);
            cocineros.add(cocinero1);
            
            Map<String, Object> cocinero2 = new HashMap<>();
            cocinero2.put("id", "COC002");
            cocinero2.put("nombre", "María González");
            cocinero2.put("especialidad", "Postres y bebidas");
            cocinero2.put("pedidosAsignados", 2);
            cocinero2.put("disponible", true);
            cocineros.add(cocinero2);
            
            Map<String, Object> cocinero3 = new HashMap<>();
            cocinero3.put("id", "COC003");
            cocinero3.put("nombre", "José Ramírez");
            cocinero3.put("especialidad", "Parrilla y carnes");
            cocinero3.put("pedidosAsignados", 4);
            cocinero3.put("disponible", false);
            cocineros.add(cocinero3);
            
            Map<String, Object> cocinero4 = new HashMap<>();
            cocinero4.put("id", "COC004");
            cocinero4.put("nombre", "Ana López");
            cocinero4.put("especialidad", "Ensaladas y entradas");
            cocinero4.put("pedidosAsignados", 1);
            cocinero4.put("disponible", true);
            cocineros.add(cocinero4);
            
            return ResponseEntity.ok(cocineros);
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
