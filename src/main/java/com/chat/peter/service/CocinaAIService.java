package com.chat.peter.service;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.ai.chat.client.ChatClient;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

/**
 * Servicio de IA para comandos naturales en cocina
 */
@Service
public class CocinaAIService {
    
    private final ChatClient chatClient;
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Constructor para inyección del ChatClient
    public CocinaAIService(ChatClient.Builder chatClientBuilder, PedidoRepository pedidoRepository) {
        this.chatClient = chatClientBuilder.build();
        this.pedidoRepository = pedidoRepository;
    }    private static final String SISTEMA_PROMPT = """
        Eres Viernes, asistente de cocina para Banquetes Peter. Responde JSON siempre.
        
        ACCIONES: INICIAR_PEDIDO, COMPLETAR_PEDIDO, PAUSAR_PEDIDO, CANCELAR_PEDIDO, CONSULTAR_ESTADO, CONSULTAR_MESA, CONVERSACION
        
        FORMATO:
        {"accion": "ACCION", "parametros": {"mesa": N}, "respuesta_usuario": "respuesta natural", "confirmacion_requerida": false, "confianza": 0.9}
        
        EJEMPLOS:
        "empezar mesa 5" → {"accion": "INICIAR_PEDIDO", "parametros": {"mesa": 5}, "respuesta_usuario": "Perfecto, inicio mesa 5", "confirmacion_requerida": false, "confianza": 0.95}
        "mesa 3 lista" → {"accion": "COMPLETAR_PEDIDO", "parametros": {"mesa": 3}, "respuesta_usuario": "Excelente, mesa 3 lista", "confirmacion_requerida": false, "confianza": 0.95}
        "estado" → {"accion": "CONSULTAR_ESTADO", "parametros": {}, "respuesta_usuario": "Te muestro el estado", "confianza": 0.9}
        """;    public RespuestaAICocina procesarComandoNatural(String comandoVoz, String contextoAdicional) {
        try {
            // Contexto ultra-compacto de la cocina
            String contextoCocina = generarContextoCocina();
            
            // Prompt optimizado y compacto
            String promptCompleto = SISTEMA_PROMPT + "\n" +
                "ESTADO: " + contextoCocina + "\n" +
                "COMANDO: \"" + comandoVoz + "\"\n" +
                "Responde JSON:";

            // Usar el AssistantService existente para procesar
            String respuestaLLM = obtenerRespuestaLLM(promptCompleto);
            
            // Parsear respuesta JSON
            RespuestaAICocina respuesta = parsearRespuestaAI(respuestaLLM);
            
            // Validar y mejorar la respuesta
            respuesta = validarYMejorarRespuesta(respuesta, comandoVoz);
              // Ejecutar acción si es necesario
            if (!respuesta.getAccion().equals("CONVERSACION")) {
                ResultadoAccion resultado = ejecutarAccion(respuesta);
                respuesta.setResultadoEjecucion(resultado);
                
                // Actualizar respuesta con resultado de manera natural
                if (resultado.isExitoso()) {
                    respuesta.setRespuestaUsuario(
                        respuesta.getRespuestaUsuario() + 
                        (resultado.getMensaje() != null ? " " + resultado.getMensaje() : "")
                    );
                } else {
                    respuesta.setRespuestaUsuario(
                        "Ups, hubo un problemita: " + resultado.getMensaje() + 
                        ". ¿Puedes intentar de nuevo?"
                    );
                }            } else {
                // Para conversaciones generales, crear un resultado exitoso sin mensaje técnico
                respuesta.setResultadoEjecucion(new ResultadoAccion(true, "", null));
            }
            
            return respuesta;
            
        } catch (Exception e) {
            return new RespuestaAICocina(
                "CONVERSACION", 
                new HashMap<>(),
                "Lo siento, no pude entender el comando. ¿Podrías repetirlo de otra manera?",
                false,
                new ResultadoAccion(false, "Error de procesamiento: " + e.getMessage(), null)
            );
        }
    }    private String generarContextoCocina() {
        StringBuilder contexto = new StringBuilder();
        
        // Resumen compacto
        List<Pedido> pendientes = pedidoRepository.findByEstado(EstadoPedido.PENDIENTE);
        List<Pedido> enPreparacion = pedidoRepository.findByEstado(EstadoPedido.EN_PREPARACION);
        List<Pedido> listos = pedidoRepository.findByEstado(EstadoPedido.LISTO);
        
        contexto.append("ESTADO: ");
        contexto.append("Pendientes(").append(pendientes.size()).append(") ");
        contexto.append("Preparando(").append(enPreparacion.size()).append(") ");
        contexto.append("Listos(").append(listos.size()).append(")\n");
        
        // Solo las primeras 3 mesas de cada estado para reducir tokens
        if (!pendientes.isEmpty()) {
            contexto.append("PEND: ");
            pendientes.stream().limit(3).forEach(p -> 
                contexto.append("M").append(p.getMesa()).append(" "));
            contexto.append("\n");
        }
        
        if (!enPreparacion.isEmpty()) {
            contexto.append("PREP: ");
            enPreparacion.stream().limit(3).forEach(p -> 
                contexto.append("M").append(p.getMesa()).append(" "));
            contexto.append("\n");
        }
        
        if (!listos.isEmpty()) {
            contexto.append("LISTO: ");
            listos.stream().limit(3).forEach(p -> 
                contexto.append("M").append(p.getMesa()).append(" "));
        }
        
        return contexto.toString();
    }private String obtenerRespuestaLLM(String prompt) {
        try {
            // **REAL AI CALL** - Usar ChatClient real en lugar de respuestas fake
            return chatClient.prompt()
                .system(prompt) // El prompt ya contiene las instrucciones del sistema completas
                .call() // Llamada real al LLM de Groq
                .content(); // Obtener contenido real de la respuesta
        } catch (Exception e) {
            throw new RuntimeException("Error al obtener respuesta del LLM real: " + e.getMessage(), e);
        }
    }    private RespuestaAICocina parsearRespuestaAI(String respuestaJSON) {
        try {
            // Buscar JSON en la respuesta
            String jsonLimpio = extraerJSON(respuestaJSON);
            JsonNode node = objectMapper.readTree(jsonLimpio);
              String accion = node.get("accion").asText();
            String respuestaUsuario = node.get("respuesta_usuario").asText();
            boolean confirmacion = node.has("confirmacion_requerida") ? node.get("confirmacion_requerida").asBoolean() : false;
            double confianza = node.has("confianza") ? node.get("confianza").asDouble() : 0.85;
            
            Map<String, Object> parametros = new HashMap<>();
            if (node.has("parametros")) {
                JsonNode paramNode = node.get("parametros");
                if (paramNode.has("mesa")) {
                    parametros.put("mesa", paramNode.get("mesa").asInt());
                }
            }
              RespuestaAICocina respuesta = new RespuestaAICocina(accion, parametros, respuestaUsuario, confirmacion, 
                new ResultadoAccion(true, "Comando parseado correctamente", null));
            respuesta.setConfianza(confianza);
            return respuesta;
            
        } catch (Exception e) {            return new RespuestaAICocina(
                "CONVERSACION",
                new HashMap<>(),
                "Entiendo tu solicitud, ¿podrías ser más específico?",
                false,
                new ResultadoAccion(false, "Error de parseo JSON", null)
            );
        }
    }
    
    private String extraerJSON(String texto) {
        // Buscar el primer { y el último }
        int inicio = texto.indexOf('{');
        int fin = texto.lastIndexOf('}');
        
        if (inicio != -1 && fin != -1 && fin > inicio) {
            return texto.substring(inicio, fin + 1);
        }
        
        throw new RuntimeException("No se encontró JSON válido en la respuesta");
    }

    private ResultadoAccion ejecutarAccion(RespuestaAICocina respuesta) {
        try {
            Map<String, Object> params = respuesta.getParametros();
            
            switch (respuesta.getAccion()) {
                case "INICIAR_PEDIDO":
                    return ejecutarIniciarPedido((Integer) params.get("mesa"));
                    
                case "COMPLETAR_PEDIDO":
                    return ejecutarCompletarPedido((Integer) params.get("mesa"));
                    
                case "PAUSAR_PEDIDO":
                    return ejecutarPausarPedido((Integer) params.get("mesa"));
                    
                case "CANCELAR_PEDIDO":
                    return ejecutarCancelarPedido((Integer) params.get("mesa"));
                    
                case "CONSULTAR_ESTADO":
                    return ejecutarConsultarEstado();
                    
                case "CONSULTAR_MESA":
                    return ejecutarConsultarMesa((Integer) params.get("mesa"));
                    
                default:
                    return new ResultadoAccion(true, "Comando procesado", null);
            }
        } catch (Exception e) {
            return new ResultadoAccion(false, "Error al ejecutar acción: " + e.getMessage(), null);
        }
    }

    private ResultadoAccion ejecutarIniciarPedido(Integer mesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstado(mesa, EstadoPedido.PENDIENTE);
        if (pedidos.isEmpty()) {
            return new ResultadoAccion(false, "No se encontró pedido pendiente para mesa " + mesa, null);
        }
        
        Pedido pedido = pedidos.get(0);
        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setFechaInicio(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoAccion(true, "Pedido iniciado correctamente", pedido);
    }

    private ResultadoAccion ejecutarCompletarPedido(Integer mesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstado(mesa, EstadoPedido.EN_PREPARACION);
        if (pedidos.isEmpty()) {
            return new ResultadoAccion(false, "No se encontró pedido en preparación para mesa " + mesa, null);
        }
          Pedido pedido = pedidos.get(0);
        pedido.setEstado(EstadoPedido.LISTO);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoAccion(true, "Pedido marcado como listo", pedido);
    }

    private ResultadoAccion ejecutarPausarPedido(Integer mesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstado(mesa, EstadoPedido.EN_PREPARACION);
        if (pedidos.isEmpty()) {
            return new ResultadoAccion(false, "No se encontró pedido en preparación para mesa " + mesa, null);
        }
        
        Pedido pedido = pedidos.get(0);
        pedido.setObservaciones((pedido.getObservaciones() != null ? pedido.getObservaciones() + " " : "") + "[PAUSADO]");
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoAccion(true, "Pedido pausado temporalmente", pedido);
    }

    private ResultadoAccion ejecutarCancelarPedido(Integer mesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstadoNotIn(mesa, List.of(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO));
        if (pedidos.isEmpty()) {
            return new ResultadoAccion(false, "No se encontró pedido activo para mesa " + mesa, null);
        }
        
        Pedido pedido = pedidos.get(0);
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoAccion(true, "Pedido cancelado", pedido);
    }

    private ResultadoAccion ejecutarConsultarEstado() {
        long pendientes = pedidoRepository.findByEstado(EstadoPedido.PENDIENTE).size();
        long enPreparacion = pedidoRepository.findByEstado(EstadoPedido.EN_PREPARACION).size();
        long listos = pedidoRepository.findByEstado(EstadoPedido.LISTO).size();
        
        String resumen = String.format("Tienes %d pedidos pendientes, %d en preparación y %d listos", 
                                     pendientes, enPreparacion, listos);
        
        return new ResultadoAccion(true, resumen, null);
    }

    private ResultadoAccion ejecutarConsultarMesa(Integer mesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesa(mesa);
        if (pedidos.isEmpty()) {
            return new ResultadoAccion(false, "No hay pedidos para la mesa " + mesa, null);
        }
        
        Pedido pedidoReciente = pedidos.stream()
            .max((p1, p2) -> p1.getFechaCreacion().compareTo(p2.getFechaCreacion()))
            .orElse(null);
            
        if (pedidoReciente != null) {
            String estado = pedidoReciente.getEstado().toString().toLowerCase();
            String info = String.format("Mesa %d está %s", mesa, estado);
            if (pedidoReciente.getEstado() == EstadoPedido.EN_PREPARACION) {
                info += " desde hace " + calcularTiempoPreparacion(pedidoReciente) + " minutos";
            }
            return new ResultadoAccion(true, info, pedidoReciente);
        }
        
        return new ResultadoAccion(false, "No se pudo obtener información de la mesa " + mesa, null);
    }

    // Métodos helper
    private int calcularTiempoEspera(Pedido pedido) {
        if (pedido.getFechaCreacion() == null) return 0;
        return (int) java.time.Duration.between(pedido.getFechaCreacion(), LocalDateTime.now()).toMinutes();
    }

    private int calcularTiempoPreparacion(Pedido pedido) {
        if (pedido.getFechaInicio() == null) return 0;
        return (int) java.time.Duration.between(pedido.getFechaInicio(), LocalDateTime.now()).toMinutes();
    }    // Clases DTO para respuestas
    public static class RespuestaAICocina {
        private String accion;
        private Map<String, Object> parametros;
        private String respuestaUsuario;
        private boolean confirmacionRequerida;
        private ResultadoAccion resultadoEjecucion;
        private double confianza = 0.85; // Confianza por defecto

        public RespuestaAICocina(String accion, Map<String, Object> parametros, 
                                String respuestaUsuario, boolean confirmacionRequerida,
                                ResultadoAccion resultadoEjecucion) {
            this.accion = accion;
            this.parametros = parametros;
            this.respuestaUsuario = respuestaUsuario;
            this.confirmacionRequerida = confirmacionRequerida;
            this.resultadoEjecucion = resultadoEjecucion;
        }

        // Getters y setters
        public String getAccion() { return accion; }
        public void setAccion(String accion) { this.accion = accion; }
        public Map<String, Object> getParametros() { return parametros; }
        public void setParametros(Map<String, Object> parametros) { this.parametros = parametros; }
        public String getRespuestaUsuario() { return respuestaUsuario; }
        public void setRespuestaUsuario(String respuestaUsuario) { this.respuestaUsuario = respuestaUsuario; }
        public boolean isConfirmacionRequerida() { return confirmacionRequerida; }
        public void setConfirmacionRequerida(boolean confirmacionRequerida) { this.confirmacionRequerida = confirmacionRequerida; }
        public ResultadoAccion getResultadoEjecucion() { return resultadoEjecucion; }
        public void setResultadoEjecucion(ResultadoAccion resultadoEjecucion) { this.resultadoEjecucion = resultadoEjecucion; }
        public double getConfianza() { return confianza; }
        public void setConfianza(double confianza) { this.confianza = confianza; }
    }

    public static class ResultadoAccion {
        private boolean exitoso;
        private String mensaje;
        private Object datos;

        public ResultadoAccion(boolean exitoso, String mensaje, Object datos) {
            this.exitoso = exitoso;
            this.mensaje = mensaje;
            this.datos = datos;
        }

        // Getters y setters
        public boolean isExitoso() { return exitoso; }
        public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
        public Object getDatos() { return datos; }
        public void setDatos(Object datos) { this.datos = datos; }
    }

    /**
     * Valida y mejora la respuesta de la IA para asegurar naturalidad
     */
    private RespuestaAICocina validarYMejorarRespuesta(RespuestaAICocina respuesta, String comandoOriginal) {
        if (respuesta == null) {
            return new RespuestaAICocina(
                "CONVERSACION",
                new HashMap<>(),
                "Disculpa, no entendí bien tu solicitud. ¿Podrías repetirla de otra manera?",
                false,
                new ResultadoAccion(false, "Respuesta nula", null)
            );
        }        // Asegurar que la confianza esté establecida
        if (respuesta.getConfianza() <= 0) {
            respuesta.setConfianza(0.8); // Confianza por defecto
        }

        // Mejorar respuestas genéricas
        String respuestaUsuario = respuesta.getRespuestaUsuario();
        if (respuestaUsuario == null || respuestaUsuario.trim().isEmpty()) {
            respuestaUsuario = generarRespuestaFallback(respuesta.getAccion(), comandoOriginal);
            respuesta.setRespuestaUsuario(respuestaUsuario);
        }

        // Verificar que las respuestas no suenen robóticas
        respuestaUsuario = hacerRespuestaMasNatural(respuestaUsuario);
        respuesta.setRespuestaUsuario(respuestaUsuario);

        return respuesta;
    }

    /**
     * Hace que las respuestas suenen más naturales y menos robóticas
     */
    private String hacerRespuestaMasNatural(String respuesta) {
        if (respuesta == null) return "¿En qué puedo ayudarte?";

        // Reemplazar frases robóticas comunes
        Map<String, String> reemplazos = Map.of(
            "comando no reconocido", "no entendí bien eso",
            "error con el servidor", "hay un problemita técnico",
            "acción ejecutada", "listo, ya está hecho",
            "procesando solicitud", "dame un segundito",
            "operación completada", "¡perfecto, ya terminé!",
            "datos actualizados", "todo actualizado",
            "sistema iniciado", "ya estamos listos",
            "confirmar acción", "¿está bien si hago eso?"
        );

        String respuestaMejorada = respuesta;
        for (Map.Entry<String, String> reemplazo : reemplazos.entrySet()) {
            respuestaMejorada = respuestaMejorada.replace(reemplazo.getKey(), reemplazo.getValue());
        }

        // Agregar variaciones naturales si la respuesta es muy corta
        if (respuestaMejorada.length() < 10) {
            respuestaMejorada = "¡" + respuestaMejorada + "! ¿Algo más en lo que pueda ayudarte?";
        }

        return respuestaMejorada;
    }

    /**
     * Genera respuesta de fallback cuando la IA no puede procesar
     */
    private String generarRespuestaFallback(String accion, String comandoOriginal) {
        return switch (accion) {
            case "INICIAR_PEDIDO" -> "¡Claro! Voy a iniciar la preparación del pedido.";
            case "COMPLETAR_PEDIDO" -> "¡Excelente! Marco el pedido como listo para servir.";
            case "PAUSAR_PEDIDO" -> "Entendido, pauso el pedido temporalmente.";
            case "CANCELAR_PEDIDO" -> "Okay, cancelo el pedido. ¿Todo bien?";
            case "CONSULTAR_ESTADO" -> "Te muestro el estado actual de la cocina.";
            case "CONSULTAR_MESA" -> "Voy a revisar el estado de esa mesa.";
            default -> "Entiendo que necesitas ayuda con: " + comandoOriginal + ". ¿Podrías ser más específico?";
        };
    }
}
