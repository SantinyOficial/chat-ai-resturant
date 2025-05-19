package com.chat.peter.model;

/**
 * DTO para recibir los mensajes del usuario.
 */
public class UserMessageRequest {
    private String message;
    private String conversationId; // Opcional, puede ser null para empezar una nueva conversación
    private String userId; // Identificador opcional del usuario
    private PedidoInfo pedidoInfo; // Información sobre los pedidos del cliente
    
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public String getConversationId() {
        return conversationId;
    }
    
    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }
    
    public String getUserId() {
        return userId;
    }
    
    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public PedidoInfo getPedidoInfo() {
        return pedidoInfo;
    }
    
    public void setPedidoInfo(PedidoInfo pedidoInfo) {
        this.pedidoInfo = pedidoInfo;
    }
    
    /**
     * Clase anidada para almacenar información sobre los pedidos del cliente
     */    public static class PedidoInfo {
        private boolean hasPedidos;
        private Integer pedidoCount;
        private String lastPedidoId;
        private String lastPedidoStatus;
        private String pedidoItems;
        private String mesa;
        private String total;
        private String fechaCreacion;
        
        public boolean isHasPedidos() {
            return hasPedidos;
        }
        
        public void setHasPedidos(boolean hasPedidos) {
            this.hasPedidos = hasPedidos;
        }
        
        public Integer getPedidoCount() {
            return pedidoCount;
        }
        
        public void setPedidoCount(Integer pedidoCount) {
            this.pedidoCount = pedidoCount;
        }
        
        public String getLastPedidoId() {
            return lastPedidoId;
        }
        
        public void setLastPedidoId(String lastPedidoId) {
            this.lastPedidoId = lastPedidoId;
        }
        
        public String getLastPedidoStatus() {
            return lastPedidoStatus;
        }
        
        public void setLastPedidoStatus(String lastPedidoStatus) {
            this.lastPedidoStatus = lastPedidoStatus;
        }
        
        public String getPedidoItems() {
            return pedidoItems;
        }
        
        public void setPedidoItems(String pedidoItems) {
            this.pedidoItems = pedidoItems;
        }
        
        public String getMesa() {
            return mesa;
        }
        
        public void setMesa(String mesa) {
            this.mesa = mesa;
        }
        
        public String getTotal() {
            return total;
        }
        
        public void setTotal(String total) {
            this.total = total;
        }
        
        public String getFechaCreacion() {
            return fechaCreacion;
        }
        
        public void setFechaCreacion(String fechaCreacion) {
            this.fechaCreacion = fechaCreacion;
        }
    }
}
