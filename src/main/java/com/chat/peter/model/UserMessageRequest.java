package com.chat.peter.model;

/**
 * DTO para recibir los mensajes del usuario.
 */
public class UserMessageRequest {
    private String message;
    private String conversationId; // Opcional, puede ser null para empezar una nueva conversación
    private String userId; // Identificador opcional del usuario
    
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
}
