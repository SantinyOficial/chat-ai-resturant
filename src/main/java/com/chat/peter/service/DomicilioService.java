package com.chat.peter.service;

import com.chat.peter.model.Direccion;
import com.chat.peter.model.Pedido;
import com.chat.peter.model.TipoEntrega;
import com.chat.peter.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Servicio para la gestión de domicilios.
 * Maneja cálculo de costos, tiempos de entrega y seguimiento de pedidos a domicilio.
 */
@Service
public class DomicilioService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    // Configuración de domicilios
    private static final double COSTO_BASE_DOMICILIO = 5000.0;
    private static final double COSTO_POR_KM = 1500.0;
    private static final double RADIO_MAXIMO_KM = 15.0;
    private static final int TIEMPO_BASE_MINUTOS = 30;
    private static final int TIEMPO_POR_KM_MINUTOS = 3;
      /**
     * Calcula el costo de envío (método para compatibilidad con el controlador)
     */
    public CostoEnvio calcularCostoEnvio(Direccion direccion) {
        ResultadoCosto resultado = calcularCostoDomicilio(direccion);
        return new CostoEnvio(resultado.isExitoso(), resultado.getCosto(), 
                             resultado.getTiempoEstimado(), calcularDistanciaSimulada(direccion), 
                             resultado.getMensaje());
    }
    
    /**
     * Obtiene el seguimiento de un pedido (sobrecarga para String)
     */
    public SeguimientoDomicilio obtenerSeguimiento(String pedidoId) {
        try {
            Long id = Long.parseLong(pedidoId);
            EstadoSeguimiento estado = obtenerSeguimientoPedido(id);
            return new SeguimientoDomicilio(estado.getEstado(), estado.getUbicacionActual(), 
                                          estado.getCoordenadas(), estado.getUltimaActualizacion(), 
                                          estado.getTiempoEstimadoLlegada());
        } catch (NumberFormatException e) {
            return new SeguimientoDomicilio("ERROR", "ID de pedido inválido", null, LocalDateTime.now(), 0);
        }
    }
    
    /**
     * Obtiene pedidos de domicilio pendientes
     */
    public List<Pedido> obtenerPedidosDomicilioPendientes() {
        return pedidoRepository.findByTipoEntregaAndEstadoNot(
            TipoEntrega.DOMICILIO, 
            com.chat.peter.model.EstadoPedido.ENTREGADO
        );
    }

    /**
     * Calcula el costo de domicilio basado en la distancia.
     */
    public ResultadoCosto calcularCostoDomicilio(Direccion direccion) {
        if (direccion == null) {
            return new ResultadoCosto(false, "Dirección no proporcionada", 0.0, 0);
        }
        
        try {
            // Simular cálculo de distancia basado en coordenadas
            double distancia = calcularDistanciaSimulada(direccion);
            
            if (distancia > RADIO_MAXIMO_KM) {
                return new ResultadoCosto(false, 
                    "Dirección fuera del área de cobertura (máximo " + RADIO_MAXIMO_KM + " km)", 
                    0.0, 0);
            }
            
            double costo = COSTO_BASE_DOMICILIO + (distancia * COSTO_POR_KM);
            int tiempoEstimado = TIEMPO_BASE_MINUTOS + (int)(distancia * TIEMPO_POR_KM_MINUTOS);
            
            return new ResultadoCosto(true, "Costo calculado exitosamente", costo, tiempoEstimado);
            
        } catch (Exception e) {
            return new ResultadoCosto(false, "Error al calcular costo: " + e.getMessage(), 0.0, 0);
        }
    }
    
    /**
     * Simula el cálculo de distancia basado en la dirección.
     * En un sistema real, esto se integraría con APIs de mapas como Google Maps.
     */
    private double calcularDistanciaSimulada(Direccion direccion) {
        // Simulación básica basada en algunos factores de la dirección
        double distanciaBase = ThreadLocalRandom.current().nextDouble(1.0, 12.0);
          // Ajustar distancia según la localidad/barrio
        String localidad = direccion.getBarrio() != null ? direccion.getBarrio().toLowerCase() : "";
        if (localidad.contains("centro")) {
            distanciaBase *= 0.7; // Más cerca del centro
        } else if (localidad.contains("norte") || localidad.contains("sur")) {
            distanciaBase *= 1.2; // Más lejos
        }
        
        return Math.round(distanciaBase * 100.0) / 100.0; // Redondear a 2 decimales
    }
    
    /**
     * Valida si una dirección está dentro del área de cobertura.
     */
    public ResultadoValidacion validarCobertura(Direccion direccion) {
        if (direccion == null) {
            return new ResultadoValidacion(false, "Dirección no proporcionada");
        }
        
        if (direccion.getDireccionCompleta() == null || direccion.getDireccionCompleta().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Dirección completa requerida");
        }
          if (direccion.getBarrio() == null || direccion.getBarrio().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Barrio requerido");
        }
        
        if (direccion.getTelefono() == null || direccion.getTelefono().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Teléfono de contacto requerido");
        }
        
        // Verificar cobertura
        double distancia = calcularDistanciaSimulada(direccion);
        if (distancia > RADIO_MAXIMO_KM) {
            return new ResultadoValidacion(false, 
                "Dirección fuera del área de cobertura. Máximo " + RADIO_MAXIMO_KM + " km");
        }
        
        return new ResultadoValidacion(true, "Dirección válida y dentro del área de cobertura");
    }
      /**
     * Crea un pedido de domicilio.
     */
    public ResultadoDomicilio configurarPedidoDomicilio(String pedidoId, Direccion direccion) {
        try {
            Optional<Pedido> optionalPedido = pedidoRepository.findById(pedidoId);
            if (!optionalPedido.isPresent()) {
                return new ResultadoDomicilio(false, "Pedido no encontrado", null);
            }
            
            Pedido pedido = optionalPedido.get();
            
            // Validar cobertura
            ResultadoValidacion validacion = validarCobertura(direccion);
            if (!validacion.isValido()) {
                return new ResultadoDomicilio(false, validacion.getMensaje(), null);
            }
            
            // Calcular costo
            ResultadoCosto resultadoCosto = calcularCostoDomicilio(direccion);
            if (!resultadoCosto.isExitoso()) {
                return new ResultadoDomicilio(false, resultadoCosto.getMensaje(), null);
            }
              // Actualizar pedido
            pedido.setTipoEntrega(TipoEntrega.DOMICILIO);
            pedido.setDireccionEntrega(direccion);
            pedido.setCostoEnvio(resultadoCosto.getCosto());
            
            // Calcular tiempo estimado como LocalDateTime
            LocalDateTime tiempoEstimado = LocalDateTime.now().plusMinutes(resultadoCosto.getTiempoEstimado());
            pedido.setTiempoEstimadoEntrega(tiempoEstimado);
            pedido.setFechaActualizacion(LocalDateTime.now());
            
            pedidoRepository.save(pedido);
            
            return new ResultadoDomicilio(true, "Domicilio configurado exitosamente", pedido);
            
        } catch (Exception e) {
            return new ResultadoDomicilio(false, "Error interno: " + e.getMessage(), null);
        }
    }
    
    /**
     * Simula el seguimiento en tiempo real de un pedido.
     */    public EstadoSeguimiento obtenerSeguimientoPedido(Long pedidoId) {
        try {
            Optional<Pedido> optionalPedido = pedidoRepository.findById(String.valueOf(pedidoId));
            if (!optionalPedido.isPresent()) {
                return new EstadoSeguimiento("ERROR", "Pedido no encontrado", null, null, 0);
            }
            
            Pedido pedido = optionalPedido.get();
            
            if (pedido.getTipoEntrega() != TipoEntrega.DOMICILIO) {
                return new EstadoSeguimiento("ERROR", "El pedido no es de domicilio", null, null, 0);
            }
            
            // Simular estado del domiciliario
            String[] estados = {"PREPARANDO", "EN_CAMINO", "CERCA", "ENTREGADO"};
            String[] ubicaciones = {"Restaurante", "Av. Principal", "Cerca de tu ubicación", "Entregado"};
            
            // Seleccionar estado según el tiempo transcurrido (simulado)
            int indiceEstado = ThreadLocalRandom.current().nextInt(estados.length);
            String estado = estados[indiceEstado];
            String ubicacionActual = ubicaciones[indiceEstado];
            
            // Simular coordenadas GPS
            double latitud = 4.5981 + ThreadLocalRandom.current().nextDouble(-0.05, 0.05);
            double longitud = -74.0758 + ThreadLocalRandom.current().nextDouble(-0.05, 0.05);
            CoordenadasGPS coordenadas = new CoordenadasGPS(latitud, longitud);
            
            // Simular tiempo estimado de llegada
            int tiempoEstimado = 0;
            switch (estado) {
                case "PREPARANDO":
                    tiempoEstimado = ThreadLocalRandom.current().nextInt(10, 25);
                    break;
                case "EN_CAMINO":
                    tiempoEstimado = ThreadLocalRandom.current().nextInt(5, 15);
                    break;
                case "CERCA":
                    tiempoEstimado = ThreadLocalRandom.current().nextInt(1, 5);
                    break;
                case "ENTREGADO":
                    tiempoEstimado = 0;
                    break;
            }
            
            return new EstadoSeguimiento(estado, ubicacionActual, coordenadas, 
                LocalDateTime.now(), tiempoEstimado);
            
        } catch (Exception e) {
            return new EstadoSeguimiento("ERROR", "Error al obtener seguimiento: " + e.getMessage(), 
                null, null, 0);
        }
    }
    
    /**
     * Obtiene todos los pedidos de domicilio activos.
     */
    public List<Pedido> obtenerPedidosDomicilioActivos() {
        return pedidoRepository.findByTipoEntregaAndEstadoNot(
            TipoEntrega.DOMICILIO, 
            com.chat.peter.model.EstadoPedido.ENTREGADO
        );
    }
    
    /**
     * Simula la actualización de ubicación del domiciliario.
     */    public ResultadoActualizacion actualizarUbicacionDomiciliario(Long pedidoId, 
            CoordenadasGPS coordenadas, String estado) {
        try {
            Optional<Pedido> optionalPedido = pedidoRepository.findById(String.valueOf(pedidoId));
            if (!optionalPedido.isPresent()) {
                return new ResultadoActualizacion(false, "Pedido no encontrado");
            }
            
            Pedido pedido = optionalPedido.get();
            
            if (pedido.getTipoEntrega() != TipoEntrega.DOMICILIO) {
                return new ResultadoActualizacion(false, "El pedido no es de domicilio");
            }
            
            // En un sistema real, aquí se guardaría la ubicación en una tabla de seguimiento
            pedido.setFechaActualizacion(LocalDateTime.now());
            pedidoRepository.save(pedido);
            
            return new ResultadoActualizacion(true, "Ubicación actualizada exitosamente");
              } catch (Exception e) {
            return new ResultadoActualizacion(false, "Error al actualizar ubicación: " + e.getMessage());
        }
    }
    
    /**
     * Sobrecarga del método para compatibilidad con el controlador
     * Simula actualización automática de ubicación
     */
    public SeguimientoDomicilio actualizarUbicacionDomiciliario(String pedidoId) {
        try {
            Long id = Long.parseLong(pedidoId);
            
            // Crear coordenadas simuladas
            CoordenadasGPS coordenadasSimuladas = new CoordenadasGPS(
                4.60971 + (ThreadLocalRandom.current().nextDouble() - 0.5) * 0.01,
                -74.08175 + (ThreadLocalRandom.current().nextDouble() - 0.5) * 0.01
            );
            
            // Actualizar con datos simulados
            ResultadoActualizacion resultado = actualizarUbicacionDomiciliario(
                id, coordenadasSimuladas, "EN_CAMINO"
            );
            
            if (resultado.isExitoso()) {
                return new SeguimientoDomicilio(
                    "EN_CAMINO",
                    "Calle 80 #15-30, Bogotá",
                    coordenadasSimuladas,
                    LocalDateTime.now(),
                    25
                );
            } else {
                throw new RuntimeException(resultado.getMensaje());
            }
            
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID de pedido inválido: " + pedidoId);
        }
    }
    
    // Clases internas para los resultados
    public static class ResultadoCosto {
        private boolean exitoso;
        private String mensaje;
        private double costo;
        private int tiempoEstimado;
        
        public ResultadoCosto(boolean exitoso, String mensaje, double costo, int tiempoEstimado) {
            this.exitoso = exitoso;
            this.mensaje = mensaje;
            this.costo = costo;
            this.tiempoEstimado = tiempoEstimado;
        }
        
        public boolean isExitoso() { return exitoso; }
        public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
        
        public double getCosto() { return costo; }
        public void setCosto(double costo) { this.costo = costo; }
        
        public int getTiempoEstimado() { return tiempoEstimado; }
        public void setTiempoEstimado(int tiempoEstimado) { this.tiempoEstimado = tiempoEstimado; }
    }
    
    public static class ResultadoValidacion {
        private boolean valido;
        private String mensaje;
        
        public ResultadoValidacion(boolean valido, String mensaje) {
            this.valido = valido;
            this.mensaje = mensaje;
        }
        
        public boolean isValido() { return valido; }
        public void setValido(boolean valido) { this.valido = valido; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    }
    
    public static class ResultadoDomicilio {
        private boolean exitoso;
        private String mensaje;
        private Pedido pedido;
        
        public ResultadoDomicilio(boolean exitoso, String mensaje, Pedido pedido) {
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
    
    public static class EstadoSeguimiento {
        private String estado;
        private String ubicacionActual;
        private CoordenadasGPS coordenadas;
        private LocalDateTime ultimaActualizacion;
        private int tiempoEstimadoLlegada;
        
        public EstadoSeguimiento(String estado, String ubicacionActual, CoordenadasGPS coordenadas,
                LocalDateTime ultimaActualizacion, int tiempoEstimadoLlegada) {
            this.estado = estado;
            this.ubicacionActual = ubicacionActual;
            this.coordenadas = coordenadas;
            this.ultimaActualizacion = ultimaActualizacion;
            this.tiempoEstimadoLlegada = tiempoEstimadoLlegada;
        }
        
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
        
        public String getUbicacionActual() { return ubicacionActual; }
        public void setUbicacionActual(String ubicacionActual) { this.ubicacionActual = ubicacionActual; }
        
        public CoordenadasGPS getCoordenadas() { return coordenadas; }
        public void setCoordenadas(CoordenadasGPS coordenadas) { this.coordenadas = coordenadas; }
        
        public LocalDateTime getUltimaActualizacion() { return ultimaActualizacion; }
        public void setUltimaActualizacion(LocalDateTime ultimaActualizacion) { this.ultimaActualizacion = ultimaActualizacion; }
        
        public int getTiempoEstimadoLlegada() { return tiempoEstimadoLlegada; }
        public void setTiempoEstimadoLlegada(int tiempoEstimadoLlegada) { this.tiempoEstimadoLlegada = tiempoEstimadoLlegada; }
    }
    
    public static class CoordenadasGPS {
        private double latitud;
        private double longitud;
        
        public CoordenadasGPS(double latitud, double longitud) {
            this.latitud = latitud;
            this.longitud = longitud;
        }
        
        public double getLatitud() { return latitud; }
        public void setLatitud(double latitud) { this.latitud = latitud; }
        
        public double getLongitud() { return longitud; }
        public void setLongitud(double longitud) { this.longitud = longitud; }
    }
      public static class ResultadoActualizacion {
        private boolean exitoso;
        private String mensaje;
        
        public ResultadoActualizacion(boolean exitoso, String mensaje) {
            this.exitoso = exitoso;
            this.mensaje = mensaje;
        }
        
        public boolean isExitoso() { return exitoso; }
        public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    }
    
    public static class CostoEnvio {
        private boolean disponible;
        private double costo;
        private int tiempoEntrega;
        private double distancia;
        private String mensaje;
        
        public CostoEnvio(boolean disponible, double costo, int tiempoEntrega, double distancia, String mensaje) {
            this.disponible = disponible;
            this.costo = costo;
            this.tiempoEntrega = tiempoEntrega;
            this.distancia = distancia;
            this.mensaje = mensaje;
        }
        
        public boolean isDisponible() { return disponible; }
        public void setDisponible(boolean disponible) { this.disponible = disponible; }
        
        public double getCosto() { return costo; }
        public void setCosto(double costo) { this.costo = costo; }
        
        public int getTiempoEntrega() { return tiempoEntrega; }
        public void setTiempoEntrega(int tiempoEntrega) { this.tiempoEntrega = tiempoEntrega; }
        
        public double getDistancia() { return distancia; }
        public void setDistancia(double distancia) { this.distancia = distancia; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
    }
      public static class SeguimientoDomicilio {
        private String estado;
        private String ubicacionActual;
        private CoordenadasGPS coordenadas;
        private LocalDateTime ultimaActualizacion;
        private int tiempoEstimadoLlegada;
        
        // Campos adicionales para el controlador
        private String pedidoId;
        private String nombreDomiciliario;
        private String telefonoDomiciliario;
        private String vehiculo;
        private LocalDateTime tiempoEstimadoEntrega;
        private String direccionDestino;
        
        public SeguimientoDomicilio(String estado, String ubicacionActual, CoordenadasGPS coordenadas,
                LocalDateTime ultimaActualizacion, int tiempoEstimadoLlegada) {
            this.estado = estado;
            this.ubicacionActual = ubicacionActual;
            this.coordenadas = coordenadas;
            this.ultimaActualizacion = ultimaActualizacion;
            this.tiempoEstimadoLlegada = tiempoEstimadoLlegada;
            
            // Valores simulados para la demo
            this.pedidoId = "PED_" + System.currentTimeMillis();
            this.nombreDomiciliario = "Carlos Martínez";
            this.telefonoDomiciliario = "3001234567";
            this.vehiculo = "Moto";
            this.tiempoEstimadoEntrega = LocalDateTime.now().plusMinutes(tiempoEstimadoLlegada);
            this.direccionDestino = ubicacionActual;
        }
        
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
        
        public String getUbicacionActual() { return ubicacionActual; }
        public void setUbicacionActual(String ubicacionActual) { this.ubicacionActual = ubicacionActual; }
        
        public CoordenadasGPS getCoordenadas() { return coordenadas; }
        public void setCoordenadas(CoordenadasGPS coordenadas) { this.coordenadas = coordenadas; }
        
        public LocalDateTime getUltimaActualizacion() { return ultimaActualizacion; }
        public void setUltimaActualizacion(LocalDateTime ultimaActualizacion) { this.ultimaActualizacion = ultimaActualizacion; }
        
        public int getTiempoEstimadoLlegada() { return tiempoEstimadoLlegada; }
        public void setTiempoEstimadoLlegada(int tiempoEstimadoLlegada) { this.tiempoEstimadoLlegada = tiempoEstimadoLlegada; }
        
        // Getters y setters para los campos adicionales
        public String getPedidoId() { return pedidoId; }
        public void setPedidoId(String pedidoId) { this.pedidoId = pedidoId; }
        
        public String getNombreDomiciliario() { return nombreDomiciliario; }
        public void setNombreDomiciliario(String nombreDomiciliario) { this.nombreDomiciliario = nombreDomiciliario; }
        
        public String getTelefonoDomiciliario() { return telefonoDomiciliario; }
        public void setTelefonoDomiciliario(String telefonoDomiciliario) { this.telefonoDomiciliario = telefonoDomiciliario; }
        
        public String getVehiculo() { return vehiculo; }
        public void setVehiculo(String vehiculo) { this.vehiculo = vehiculo; }
        
        public LocalDateTime getTiempoEstimadoEntrega() { return tiempoEstimadoEntrega; }
        public void setTiempoEstimadoEntrega(LocalDateTime tiempoEstimadoEntrega) { this.tiempoEstimadoEntrega = tiempoEstimadoEntrega; }
        
        public String getDireccionDestino() { return direccionDestino; }
        public void setDireccionDestino(String direccionDestino) { this.direccionDestino = direccionDestino; }
    }
}
