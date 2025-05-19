package com.chat.peter.model;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para mostrar un resumen de la conversación
 */
public class ConversationSummary {
    private String id;
    private String userId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int messageCount;
    private ChatMessage lastMessage;
    
    public ConversationSummary() {
    }
    
    public ConversationSummary(Conversation conversation, List<ChatMessage> messages) {
        this.id = conversation.getId();
        this.userId = conversation.getUserId();
        this.createdAt = conversation.getCreatedAt();
        this.updatedAt = conversation.getUpdatedAt();
        this.messageCount = messages.size();
        this.lastMessage = messages.isEmpty() ? null : messages.get(messages.size() - 1);
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public int getMessageCount() {
        return messageCount;
    }

    public void setMessageCount(int messageCount) {
        this.messageCount = messageCount;
    }

    public ChatMessage getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(ChatMessage lastMessage) {
        this.lastMessage = lastMessage;
    }
}
