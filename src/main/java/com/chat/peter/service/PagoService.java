package com.chat.peter.service;

import com.chat.peter.model.Pago;
import com.chat.peter.model.MetodoPago;
import com.chat.peter.model.Pedido;
import com.chat.peter.repository.PedidoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de pagos simulados.
 * Procesa diferentes métodos de pago de forma ficticia para demostración del MVP.
 */
@Service
public class PagoService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    /**
     * Procesa un pago de forma asíncrona.
     */
    public CompletableFuture<ResultadoPago> procesarPago(Pago pago, Long pedidoId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Simular tiempo de procesamiento según el método de pago
                Thread.sleep(obtenerTiempoProcessamiento(pago.getMetodoPago()));
                
                // Simular éxito/fallo del pago
                boolean exitoso = simularExito(pago.getMetodoPago());
                
                if (exitoso) {
                    return procesarPagoExitoso(pago, pedidoId);
                } else {
                    return procesarPagoFallido(pago, pedidoId);
                }
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return new ResultadoPago(false, "Proceso interrumpido", null, null);
            } catch (Exception e) {
                return new ResultadoPago(false, "Error interno: " + e.getMessage(), null, null);
            }
        });
    }
    
    private ResultadoPago procesarPagoExitoso(Pago pago, Long pedidoId) {
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstadoPago("APROBADO");
        pago.setTransaccionId(generarIdTransaccion());
        pago.setReferenciaBanco(generarReferenciaBanco(pago.getMetodoPago()));
          // Actualizar pedido si se proporciona
        Pedido pedido = null;
        if (pedidoId != null) {
            Optional<Pedido> optionalPedido = pedidoRepository.findById(String.valueOf(pedidoId));
            if (optionalPedido.isPresent()) {
                pedido = optionalPedido.get();
                pedido.setPago(pago);
                pedido.setFechaActualizacion(LocalDateTime.now());
                pedidoRepository.save(pedido);
            }
        }
        
        return new ResultadoPago(true, "Pago procesado exitosamente", pago, pedido);
    }
    
    private ResultadoPago procesarPagoFallido(Pago pago, Long pedidoId) {
        pago.setFechaPago(LocalDateTime.now());
        pago.setEstadoPago("RECHAZADO");
        pago.setMensajeError(generarMensajeError(pago.getMetodoPago()));
        
        return new ResultadoPago(false, pago.getMensajeError(), pago, null);
    }
    
    private long obtenerTiempoProcessamiento(MetodoPago metodo) {
        switch (metodo) {
            case EFECTIVO:
                return 100; // Inmediato
            case TARJETA:
                return ThreadLocalRandom.current().nextLong(2000, 5000); // 2-5 segundos
            case NEQUI:
                return ThreadLocalRandom.current().nextLong(1000, 3000); // 1-3 segundos
            case PSE:
                return ThreadLocalRandom.current().nextLong(3000, 8000); // 3-8 segundos
            case DAVIPLATA:
                return ThreadLocalRandom.current().nextLong(1500, 4000); // 1.5-4 segundos
            default:
                return 2000;
        }
    }
    
    private boolean simularExito(MetodoPago metodo) {
        // Simular tasas de éxito realistas
        double probabilidadExito;
        switch (metodo) {
            case EFECTIVO:
                probabilidadExito = 1.0; // Siempre exitoso
                break;
            case TARJETA:
                probabilidadExito = 0.92; // 92% éxito
                break;
            case NEQUI:
                probabilidadExito = 0.95; // 95% éxito
                break;
            case PSE:
                probabilidadExito = 0.88; // 88% éxito
                break;
            case DAVIPLATA:
                probabilidadExito = 0.94; // 94% éxito
                break;
            default:
                probabilidadExito = 0.90;
        }
        
        return ThreadLocalRandom.current().nextDouble() < probabilidadExito;
    }
    
    private String generarIdTransaccion() {
        return "TXN" + System.currentTimeMillis() + ThreadLocalRandom.current().nextInt(1000, 9999);
    }
    
    private String generarReferenciaBanco(MetodoPago metodo) {
        String prefijo;
        switch (metodo) {
            case TARJETA:
                prefijo = "VISA";
                break;
            case NEQUI:
                prefijo = "NEQ";
                break;
            case PSE:
                prefijo = "PSE";
                break;
            case DAVIPLATA:
                prefijo = "DVP";
                break;
            default:
                prefijo = "REF";
        }
        
        return prefijo + System.currentTimeMillis() % 100000;
    }
    
    private String generarMensajeError(MetodoPago metodo) {
        String[] erroresComunes = {
            "Fondos insuficientes",
            "Tarjeta bloqueada",
            "Error de conexión con el banco",
            "Datos incorrectos",
            "Transacción no autorizada",
            "Límite diario excedido"
        };
        
        return erroresComunes[ThreadLocalRandom.current().nextInt(erroresComunes.length)];
    }
    
    /**
     * Valida los datos de pago según el método seleccionado.
     */
    public ResultadoValidacion validarDatosPago(Pago pago) {
        if (pago == null) {
            return new ResultadoValidacion(false, "Datos de pago no proporcionados");
        }
        
        if (pago.getMonto() <= 0) {
            return new ResultadoValidacion(false, "Monto inválido");
        }
        
        if (pago.getMetodoPago() == null) {
            return new ResultadoValidacion(false, "Método de pago no especificado");
        }
        
        switch (pago.getMetodoPago()) {
            case TARJETA:
                return validarTarjeta(pago);
            case NEQUI:
                return validarNequi(pago);
            case PSE:
                return validarPSE(pago);
            case DAVIPLATA:
                return validarDaviplata(pago);
            case EFECTIVO:
                return new ResultadoValidacion(true, "Pago en efectivo válido");
            default:
                return new ResultadoValidacion(false, "Método de pago no soportado");
        }
    }
    
    private ResultadoValidacion validarTarjeta(Pago pago) {
        if (pago.getNumeroTarjeta() == null || pago.getNumeroTarjeta().length() < 16) {
            return new ResultadoValidacion(false, "Número de tarjeta inválido");
        }
        
        if (pago.getNombreTarjeta() == null || pago.getNombreTarjeta().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Nombre del titular requerido");
        }
        
        if (pago.getFechaVencimiento() == null) {
            return new ResultadoValidacion(false, "Fecha de vencimiento requerida");
        }
        
        if (pago.getCvv() == null || pago.getCvv().length() < 3) {
            return new ResultadoValidacion(false, "CVV inválido");
        }
        
        return new ResultadoValidacion(true, "Datos de tarjeta válidos");
    }
    
    private ResultadoValidacion validarNequi(Pago pago) {
        if (pago.getTelefonoNequi() == null || pago.getTelefonoNequi().length() < 10) {
            return new ResultadoValidacion(false, "Número de teléfono Nequi inválido");
        }
        
        return new ResultadoValidacion(true, "Datos de Nequi válidos");
    }
    
    private ResultadoValidacion validarPSE(Pago pago) {
        if (pago.getBancoPSE() == null || pago.getBancoPSE().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Banco PSE requerido");
        }
        
        if (pago.getTipoPersona() == null || pago.getTipoPersona().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Tipo de persona requerido");
        }
        
        if (pago.getNumeroDocumento() == null || pago.getNumeroDocumento().trim().isEmpty()) {
            return new ResultadoValidacion(false, "Número de documento requerido");
        }
        
        return new ResultadoValidacion(true, "Datos de PSE válidos");
    }
    
    private ResultadoValidacion validarDaviplata(Pago pago) {
        if (pago.getTelefonoDaviplata() == null || pago.getTelefonoDaviplata().length() < 10) {
            return new ResultadoValidacion(false, "Número de teléfono Daviplata inválido");
        }
        
        return new ResultadoValidacion(true, "Datos de Daviplata válidos");
    }
    
    /**
     * Obtiene los métodos de pago disponibles.
     */
    public List<MetodoPago> obtenerMetodosDisponibles() {
        return List.of(MetodoPago.values());
    }
    
    /**
     * Consulta el estado de una transacción.
     */
    public EstadoTransaccion consultarEstadoTransaccion(String transaccionId) {
        // Simulación de consulta de estado
        if (transaccionId == null || transaccionId.trim().isEmpty()) {
            return new EstadoTransaccion("INVALIDO", "ID de transacción inválido", null);
        }
        
        // Simular diferentes estados posibles
        String[] estados = {"APROBADO", "PENDIENTE", "RECHAZADO", "EN_PROCESO"};
        String estado = estados[ThreadLocalRandom.current().nextInt(estados.length)];
        
        String mensaje;
        switch (estado) {
            case "APROBADO":
                mensaje = "Transacción aprobada exitosamente";
                break;
            case "PENDIENTE":
                mensaje = "Transacción pendiente de aprobación";
                break;
            case "RECHAZADO":
                mensaje = "Transacción rechazada por el banco";
                break;
            case "EN_PROCESO":
                mensaje = "Transacción en proceso de verificación";
                break;
            default:
                mensaje = "Estado desconocido";
        }
        
        return new EstadoTransaccion(estado, mensaje, LocalDateTime.now());
    }
    
    // Clases internas para los resultados
    public static class ResultadoPago {
        private boolean exitoso;
        private String mensaje;
        private Pago pago;
        private Pedido pedido;
        
        public ResultadoPago(boolean exitoso, String mensaje, Pago pago, Pedido pedido) {
            this.exitoso = exitoso;
            this.mensaje = mensaje;
            this.pago = pago;
            this.pedido = pedido;
        }
        
        public boolean isExitoso() { return exitoso; }
        public void setExitoso(boolean exitoso) { this.exitoso = exitoso; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
        
        public Pago getPago() { return pago; }
        public void setPago(Pago pago) { this.pago = pago; }
        
        public Pedido getPedido() { return pedido; }
        public void setPedido(Pedido pedido) { this.pedido = pedido; }
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
    
    public static class EstadoTransaccion {
        private String estado;
        private String mensaje;
        private LocalDateTime fechaConsulta;
        
        public EstadoTransaccion(String estado, String mensaje, LocalDateTime fechaConsulta) {
            this.estado = estado;
            this.mensaje = mensaje;
            this.fechaConsulta = fechaConsulta;
        }
        
        public String getEstado() { return estado; }
        public void setEstado(String estado) { this.estado = estado; }
        
        public String getMensaje() { return mensaje; }
        public void setMensaje(String mensaje) { this.mensaje = mensaje; }
          public LocalDateTime getFechaConsulta() { return fechaConsulta; }
        public void setFechaConsulta(LocalDateTime fechaConsulta) { this.fechaConsulta = fechaConsulta; }
    }
    
    /**
     * Clase interna que representa la información de un método de pago
     */
    public static class MetodoPagoInfo {
        private MetodoPago metodoPago;
        private String nombre;
        private String descripcion;
        private boolean requiereQR;
        private List<String> camposRequeridos;
        private String tiempoProcesamiento;
        private double comision;
        
        public MetodoPagoInfo(MetodoPago metodoPago, String nombre, String descripcion, 
                             boolean requiereQR, List<String> camposRequeridos, 
                             String tiempoProcesamiento, double comision) {
            this.metodoPago = metodoPago;
            this.nombre = nombre;
            this.descripcion = descripcion;
            this.requiereQR = requiereQR;
            this.camposRequeridos = camposRequeridos;
            this.tiempoProcesamiento = tiempoProcesamiento;
            this.comision = comision;
        }
        
        // Getters y Setters
        public MetodoPago getMetodoPago() { return metodoPago; }
        public void setMetodoPago(MetodoPago metodoPago) { this.metodoPago = metodoPago; }
        
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        
        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
        
        public boolean isRequiereQR() { return requiereQR; }
        public void setRequiereQR(boolean requiereQR) { this.requiereQR = requiereQR; }
        
        public List<String> getCamposRequeridos() { return camposRequeridos; }
        public void setCamposRequeridos(List<String> camposRequeridos) { this.camposRequeridos = camposRequeridos; }
        
        public String getTiempoProcesamiento() { return tiempoProcesamiento; }
        public void setTiempoProcesamiento(String tiempoProcesamiento) { this.tiempoProcesamiento = tiempoProcesamiento; }
        
        public double getComision() { return comision; }
        public void setComision(double comision) { this.comision = comision; }
    }
    
    /**
     * Clase interna que representa los datos específicos para cada método de pago
     */
    public static class DatosPago {
        // Datos para tarjeta
        private String numeroTarjeta;
        private String cvv;
        private String fechaVencimiento;
        private String nombreTitular;
        
        // Datos para métodos móviles (Nequi, Daviplata)
        private String telefono;
        
        // Datos para PSE
        private String banco;
        private String tipoDocumento;
        private String numeroDocumento;
        
        public DatosPago() {}
        
        // Getters y Setters
        public String getNumeroTarjeta() { return numeroTarjeta; }
        public void setNumeroTarjeta(String numeroTarjeta) { this.numeroTarjeta = numeroTarjeta; }
        
        public String getCvv() { return cvv; }
        public void setCvv(String cvv) { this.cvv = cvv; }
        
        public String getFechaVencimiento() { return fechaVencimiento; }
        public void setFechaVencimiento(String fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
        
        public String getNombreTitular() { return nombreTitular; }
        public void setNombreTitular(String nombreTitular) { this.nombreTitular = nombreTitular; }
        
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
        
        public String getBanco() { return banco; }
        public void setBanco(String banco) { this.banco = banco; }
        
        public String getTipoDocumento() { return tipoDocumento; }
        public void setTipoDocumento(String tipoDocumento) { this.tipoDocumento = tipoDocumento; }
          public String getNumeroDocumento() { return numeroDocumento; }
        public void setNumeroDocumento(String numeroDocumento) { this.numeroDocumento = numeroDocumento; }
    }
    
    /**
     * Obtiene los métodos de pago disponibles con información detallada
     */
    public List<MetodoPagoInfo> obtenerMetodosPagoDisponibles() {
        return List.of(
            new MetodoPagoInfo(MetodoPago.EFECTIVO, "Efectivo", "Pago en efectivo al momento de la entrega", 
                             false, List.of(), "Inmediato", 0.0),
            new MetodoPagoInfo(MetodoPago.TARJETA, "Tarjeta de Crédito/Débito", "Pago con tarjeta Visa, Mastercard", 
                             false, List.of("numeroTarjeta", "cvv", "fechaVencimiento", "nombreTitular"), "2-5 segundos", 0.03),
            new MetodoPagoInfo(MetodoPago.NEQUI, "Nequi", "Pago móvil con Nequi", 
                             true, List.of("telefono"), "1-3 segundos", 0.01),
            new MetodoPagoInfo(MetodoPago.PSE, "PSE", "Pagos Seguros en Línea", 
                             false, List.of("banco", "tipoDocumento", "numeroDocumento"), "3-8 segundos", 0.02),
            new MetodoPagoInfo(MetodoPago.DAVIPLATA, "Daviplata", "Pago móvil con Daviplata", 
                             true, List.of("telefono"), "1.5-4 segundos", 0.015)
        );
    }
    
    /**
     * Consulta el estado de un pago por ID
     */
    public Pago consultarPago(String pagoId) {
        // Simulación de consulta de pago
        if (pagoId == null || pagoId.trim().isEmpty()) {
            return null;
        }
        
        // En un caso real, consultaríamos una base de datos
        // Para la demo, creamos un pago simulado
        Pago pago = new Pago();
        pago.setId(pagoId);
        pago.setEstadoPago("APROBADO");
        pago.setTransaccionId("TXN" + System.currentTimeMillis());
        pago.setMonto(25000);
        pago.setMetodoPago(MetodoPago.TARJETA);
        pago.setFechaPago(LocalDateTime.now().minusMinutes(5));
        
        return pago;
    }
    
    /**
     * Genera un código QR para métodos de pago que lo requieran
     */
    public String generarCodigoQR(MetodoPago metodoPago, Double monto, String referencia) {
        if (metodoPago == null || monto == null || monto <= 0) {
            throw new IllegalArgumentException("Parámetros inválidos para generar QR");
        }
        
        // Simulación de generación de código QR
        String codigoQR;
        switch (metodoPago) {
            case NEQUI:
                codigoQR = "NEQUI_QR_" + System.currentTimeMillis() + "_" + monto.intValue();
                break;
            case DAVIPLATA:
                codigoQR = "DAVIPLATA_QR_" + System.currentTimeMillis() + "_" + monto.intValue();
                break;
            default:
                throw new IllegalArgumentException("El método de pago " + metodoPago + " no soporta códigos QR");
        }
          return codigoQR + "_REF_" + (referencia != null ? referencia : "DEFAULT");
    }
}
