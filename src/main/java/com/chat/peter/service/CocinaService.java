package com.chat.peter.service;

import com.chat.peter.model.Pedido;
import com.chat.peter.model.EstadoPedido;
import com.chat.peter.model.PedidoItem;
import com.chat.peter.repository.PedidoRepository;
import com.chat.peter.dto.PedidoCocinaDTO;
import com.chat.peter.dto.ItemCocinaDTO;
import com.chat.peter.dto.EstadisticasCocinaDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.stream.Collectors;

/**
 * Servicio para el módulo de cocina con comandos de voz.
 * Procesa comandos de voz simulados para gestionar pedidos desde la cocina.
 */
@Service
public class CocinaService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    // Patrones de comandos de voz reconocidos
    private static final Pattern PATRON_PEDIDO_LISTO = Pattern.compile(
        "(?i)(pedido|orden)\\s+(\\d+|mesa\\s+\\d+)\\s+(listo|terminado|completo)"
    );
    
    private static final Pattern PATRON_INICIAR_PREPARACION = Pattern.compile(
        "(?i)(iniciar|empezar|comenzar)\\s+(pedido|orden)\\s+(\\d+|mesa\\s+\\d+)"
    );
    
    private static final Pattern PATRON_PAUSAR_PEDIDO = Pattern.compile(
        "(?i)(pausar|detener|parar)\\s+(pedido|orden)\\s+(\\d+|mesa\\s+\\d+)"
    );
    
    private static final Pattern PATRON_REANUDAR_PEDIDO = Pattern.compile(
        "(?i)(reanudar|continuar|seguir)\\s+(pedido|orden)\\s+(\\d+|mesa\\s+\\d+)"
    );
    
    private static final Pattern PATRON_CANCELAR_PEDIDO = Pattern.compile(
        "(?i)(cancelar|anular)\\s+(pedido|orden)\\s+(\\d+|mesa\\s+\\d+)"
    );
    
    /**
     * Procesa un comando de voz y ejecuta la acción correspondiente.
     */
    public ResultadoComando procesarComandoVoz(String comandoVoz) {
        if (comandoVoz == null || comandoVoz.trim().isEmpty()) {
            return new ResultadoComando(false, "Comando vacío", null);
        }
        
        comandoVoz = comandoVoz.trim();
        
        try {
            ResultadoComando resultado = null;
            
            if (PATRON_PEDIDO_LISTO.matcher(comandoVoz).find()) {
                resultado = marcarPedidoListo(comandoVoz);
            } else if (PATRON_INICIAR_PREPARACION.matcher(comandoVoz).find()) {
                resultado = iniciarPreparacion(comandoVoz);
            } else if (PATRON_PAUSAR_PEDIDO.matcher(comandoVoz).find()) {
                resultado = pausarPedido(comandoVoz);
            } else if (PATRON_REANUDAR_PEDIDO.matcher(comandoVoz).find()) {
                resultado = reanudarPedido(comandoVoz);
            } else if (PATRON_CANCELAR_PEDIDO.matcher(comandoVoz).find()) {
                resultado = cancelarPedido(comandoVoz);
            } else {
                resultado = new ResultadoComando(false, "Comando no reconocido", null);
            }
            
            return resultado;
            
        } catch (Exception e) {
            return new ResultadoComando(false, "Error interno: " + e.getMessage(), null);
        }
    }
      private ResultadoComando marcarPedidoListo(String comando) {
        Integer numeroMesa = extraerNumeroMesa(comando);
        if (numeroMesa == null) {
            return new ResultadoComando(false, "No se pudo identificar el número de mesa", null);
        }
        
        Pedido pedido = buscarPedidoActivoPorMesa(numeroMesa);
        if (pedido == null) {
            return new ResultadoComando(false, "No se encontró pedido activo para la mesa " + numeroMesa, null);
        }
        
        if (pedido.getEstado() == EstadoPedido.ENTREGADO) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " ya fue entregado", pedido);
        }
        
        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " está cancelado", pedido);
        }
        
        if (pedido.getEstado() != EstadoPedido.EN_PREPARACION) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " no está en preparación", pedido);
        }
        
        pedido.setEstado(EstadoPedido.LISTO);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoComando(true, "Pedido de la mesa " + numeroMesa + " marcado como listo", pedido);
    }
      private ResultadoComando iniciarPreparacion(String comando) {
        Integer numeroMesa = extraerNumeroMesa(comando);
        if (numeroMesa == null) {
            return new ResultadoComando(false, "No se pudo identificar el número de mesa", null);
        }
        
        Pedido pedido = buscarPedidoPendientePorMesa(numeroMesa);
        if (pedido == null) {
            return new ResultadoComando(false, "No se encontró pedido pendiente para la mesa " + numeroMesa, null);
        }
        
        if (pedido.getEstado() != EstadoPedido.PENDIENTE) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " no está en estado pendiente", pedido);
        }
        
        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoComando(true, "Iniciada preparación del pedido de la mesa " + numeroMesa, pedido);
    }
      private ResultadoComando pausarPedido(String comando) {
        Integer numeroMesa = extraerNumeroMesa(comando);
        if (numeroMesa == null) {
            return new ResultadoComando(false, "No se pudo identificar el número de mesa", null);
        }
        
        Pedido pedido = buscarPedidoEnPreparacionPorMesa(numeroMesa);
        if (pedido == null) {
            return new ResultadoComando(false, "No se encontró pedido en preparación para la mesa " + numeroMesa, null);
        }
        
        if (pedido.getEstado() != EstadoPedido.EN_PREPARACION) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " no está en preparación", pedido);
        }
        
        // Nota: Actualmente no hay estado PAUSADO en el enum, mantendríamos EN_PREPARACION
        // pero podríamos agregar una observación
        pedido.setObservaciones((pedido.getObservaciones() != null ? pedido.getObservaciones() + " " : "") + "[PAUSADO]");
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoComando(true, "Pedido de la mesa " + numeroMesa + " pausado temporalmente", pedido);
    }
      private ResultadoComando reanudarPedido(String comando) {
        Integer numeroMesa = extraerNumeroMesa(comando);
        if (numeroMesa == null) {
            return new ResultadoComando(false, "No se pudo identificar el número de mesa", null);
        }
        
        Pedido pedido = buscarPedidoActivoPorMesa(numeroMesa);
        if (pedido == null) {
            return new ResultadoComando(false, "No se encontró pedido activo para la mesa " + numeroMesa, null);
        }
        
        // Quitar la marca de pausado de las observaciones
        if (pedido.getObservaciones() != null && pedido.getObservaciones().contains("[PAUSADO]")) {
            pedido.setObservaciones(pedido.getObservaciones().replace("[PAUSADO]", "").trim());
        }
        
        pedido.setEstado(EstadoPedido.EN_PREPARACION);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoComando(true, "Pedido de la mesa " + numeroMesa + " reanudado", pedido);
    }
      private ResultadoComando cancelarPedido(String comando) {
        Integer numeroMesa = extraerNumeroMesa(comando);
        if (numeroMesa == null) {
            return new ResultadoComando(false, "No se pudo identificar el número de mesa", null);
        }
        
        Pedido pedido = buscarPedidoActivoPorMesa(numeroMesa);
        if (pedido == null) {
            return new ResultadoComando(false, "No se encontró pedido activo para la mesa " + numeroMesa, null);
        }
        
        if (pedido.getEstado() == EstadoPedido.ENTREGADO) {
            return new ResultadoComando(false, "No se puede cancelar un pedido ya entregado de la mesa " + numeroMesa, pedido);
        }
        
        if (pedido.getEstado() == EstadoPedido.CANCELADO) {
            return new ResultadoComando(false, "El pedido de la mesa " + numeroMesa + " ya está cancelado", pedido);
        }
        
        pedido.setEstado(EstadoPedido.CANCELADO);
        pedido.setFechaActualizacion(LocalDateTime.now());
        pedidoRepository.save(pedido);
        
        return new ResultadoComando(true, "Pedido de la mesa " + numeroMesa + " cancelado", pedido);
    }
      private Integer extraerNumeroMesa(String comando) {
        Pattern pattern = Pattern.compile("(?:mesa\\s+)?(\\d+)");
        Matcher matcher = pattern.matcher(comando.toLowerCase());
        
        if (matcher.find()) {
            try {
                return Integer.parseInt(matcher.group(1));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        
        return null;
    }
    
    /**
     * Busca el pedido más reciente activo (no entregado ni cancelado) para una mesa específica
     */
    private Pedido buscarPedidoActivoPorMesa(Integer numeroMesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstadoNotIn(
            numeroMesa, 
            List.of(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO)
        );
        
        // Retornar el más reciente
        return pedidos.stream()
                .max((p1, p2) -> p1.getFechaCreacion().compareTo(p2.getFechaCreacion()))
                .orElse(null);
    }
    
    /**
     * Busca el pedido pendiente más reciente para una mesa específica
     */
    private Pedido buscarPedidoPendientePorMesa(Integer numeroMesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstado(numeroMesa, EstadoPedido.PENDIENTE);
        
        // Retornar el más reciente
        return pedidos.stream()
                .max((p1, p2) -> p1.getFechaCreacion().compareTo(p2.getFechaCreacion()))
                .orElse(null);
    }
    
    /**
     * Busca el pedido en preparación más reciente para una mesa específica
     */
    private Pedido buscarPedidoEnPreparacionPorMesa(Integer numeroMesa) {
        List<Pedido> pedidos = pedidoRepository.findByMesaAndEstado(numeroMesa, EstadoPedido.EN_PREPARACION);
        
        // Retornar el más reciente
        return pedidos.stream()
                .max((p1, p2) -> p1.getFechaCreacion().compareTo(p2.getFechaCreacion()))
                .orElse(null);
    }/**
     * Obtiene pedidos por estado específico como DTOs
     */
    public List<PedidoCocinaDTO> obtenerPedidosPorEstado(EstadoPedido estado) {
        List<Pedido> pedidos = pedidoRepository.findByEstado(estado);
        return pedidos.stream()
                .map(this::convertirAPedidoCocinaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene todos los pedidos activos (no entregados ni cancelados) como DTOs
     */
    public List<PedidoCocinaDTO> obtenerPedidosActivos() {
        List<Pedido> pedidos = pedidoRepository.findByEstadoNotIn(
            List.of(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO)
        );
        return pedidos.stream()
                .map(this::convertirAPedidoCocinaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene los pedidos que deben mostrarse en la cocina (PENDIENTE y EN_PREPARACION)
     */
    public List<PedidoCocinaDTO> obtenerPedidosPendientes() {
        List<Pedido> pedidos = pedidoRepository.findByEstadoIn(
            List.of(EstadoPedido.PENDIENTE, EstadoPedido.EN_PREPARACION)
        );
        return pedidos.stream()
                .map(this::convertirAPedidoCocinaDTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene estadísticas de la cocina
     */
    public EstadisticasCocinaDTO obtenerEstadisticasCocina() {
        EstadisticasCocinaDTO estadisticas = new EstadisticasCocinaDTO();
        
        List<Pedido> todosLosPedidos = pedidoRepository.findAll();
        List<Pedido> pedidosActivos = pedidoRepository.findByEstadoNotIn(
            List.of(EstadoPedido.ENTREGADO, EstadoPedido.CANCELADO)
        );
          estadisticas.setPedidosPendientes(
            todosLosPedidos.stream().filter(p -> p.getEstado() == EstadoPedido.PENDIENTE).count()
        );
        estadisticas.setPedidosEnPreparacion(
            todosLosPedidos.stream().filter(p -> p.getEstado() == EstadoPedido.EN_PREPARACION).count()
        );
        estadisticas.setPedidosListos(
            todosLosPedidos.stream().filter(p -> p.getEstado() == EstadoPedido.LISTO).count()
        );
        estadisticas.setTotalPedidosActivos((long) pedidosActivos.size());
        
        // Calcular tiempo promedio de preparación
        double tiempoPromedio = pedidosActivos.stream()
                .filter(p -> p.getFechaCreacion() != null)
                .mapToLong(p -> java.time.Duration.between(p.getFechaCreacion(), LocalDateTime.now()).toMinutes())
                .average()
                .orElse(0.0);
        estadisticas.setTiempoPromedioPreparacion(tiempoPromedio);
        
        return estadisticas;
    }

    /**
     * Convierte un Pedido a PedidoCocinaDTO
     */
    private PedidoCocinaDTO convertirAPedidoCocinaDTO(Pedido pedido) {
        PedidoCocinaDTO dto = new PedidoCocinaDTO();
        dto.setId(pedido.getId());
        dto.setClienteNombre(pedido.getClienteNombre());
        dto.setMesa(pedido.getMesa());
        dto.setFechaRecibido(pedido.getFechaCreacion() != null ? 
            pedido.getFechaCreacion().toString() : null);
        dto.setFechaInicio(pedido.getFechaInicio() != null ? 
            pedido.getFechaInicio().toString() : null);
        dto.setEstado(convertirEstadoPedidoAEstadoCocina(pedido.getEstado()));
        dto.setPrioridad(calcularPrioridad(pedido));
        dto.setObservaciones(pedido.getObservaciones());
        dto.setCocineroAsignado(pedido.getCocineroAsignado());
        dto.setTiempoEstimado(pedido.getTiempoEstimado() != null ? 
            pedido.getTiempoEstimado().toString() : null);
        
        // Convertir items
        List<ItemCocinaDTO> items = pedido.getItems().stream()
                .map(this::convertirAItemCocinaDTO)
                .collect(Collectors.toList());
        dto.setItems(items);
        
        return dto;
    }

    /**
     * Convierte un PedidoItem a ItemCocinaDTO
     */
    private ItemCocinaDTO convertirAItemCocinaDTO(PedidoItem item) {
        ItemCocinaDTO dto = new ItemCocinaDTO();
        dto.setNombre(item.getNombre());
        dto.setCantidad(item.getCantidad());
        dto.setEstado(item.getEstado() != null ? item.getEstado() : "PENDIENTE");
        dto.setObservaciones(item.getObservaciones());
        dto.setTiempoPreparacion(item.getTiempoPreparacion() != null ? 
            item.getTiempoPreparacion().toString() : null);
        return dto;
    }

    /**
     * Convierte EstadoPedido a EstadoCocina
     */
    private String convertirEstadoPedidoAEstadoCocina(EstadoPedido estadoPedido) {
        switch (estadoPedido) {
            case PENDIENTE:
                return "RECIBIDO";
            case EN_PREPARACION:
                return "EN_PREPARACION";
            case LISTO:
                return "LISTO";
            case ENTREGADO:
                return "ENTREGADO";
            case CANCELADO:
                return "CANCELADO";
            default:
                return "RECIBIDO";
        }
    }

    /**
     * Calcula la prioridad del pedido basado en tiempo de espera
     */
    private String calcularPrioridad(Pedido pedido) {
        if (pedido.getFechaCreacion() == null) {
            return "NORMAL";
        }
        
        long minutosEspera = java.time.Duration.between(
            pedido.getFechaCreacion(), 
            LocalDateTime.now()
        ).toMinutes();
        
        if (minutosEspera > 30) {
            return "ALTA";
        } else if (minutosEspera > 15) {
            return "MEDIA";
        } else {
            return "NORMAL";
        }
    }
    
    public List<String> obtenerComandosSugeridos() {
        return List.of(
            "Iniciar pedido [número]",
            "Pedido [número] listo",
            "Pausar pedido [número]",
            "Reanudar pedido [número]",
            "Cancelar pedido [número]"
        );
    }
    
    public static class ResultadoComando {
        private boolean exitoso;
        private String mensaje;
        private Pedido pedido;
        
        public ResultadoComando(boolean exitoso, String mensaje, Pedido pedido) {
            this.exitoso = exitoso;
            this.mensaje = mensaje;
            this.pedido = pedido;
        }
        
        public boolean isExitoso() { return exitoso; }
        public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
        
        public Pedido getPedido() { return pedido; }
        public void setPedido(Pedido pedido) { this.pedido = pedido; }
    }
}
