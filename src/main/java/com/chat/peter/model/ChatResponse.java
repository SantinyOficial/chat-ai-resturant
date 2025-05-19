package com.chat.peter.model;

/**
 * DTO para respuestas del asistente
 */
public class ChatResponse {
    private ChatMessage message;
    private String conversationId;
    private boolean isNewConversation;
    
    public ChatResponse() {
    }
    
    public ChatResponse(ChatMessage message, String conversationId, boolean isNewConversation) {
        this.message = message;
        this.conversationId = conversationId;
        this.isNewConversation = isNewConversation;
    }

    public ChatMessage getMessage() {
        return message;
    }

    public void setMessage(ChatMessage message) {
        this.message = message;
    }

    public String getConversationId() {
        return conversationId;
    }

    public void setConversationId(String conversationId) {
        this.conversationId = conversationId;
    }

    public boolean isNewConversation() {
        return isNewConversation;
    }

    public void setNewConversation(boolean isNewConversation) {
        this.isNewConversation = isNewConversation;
    }
}
