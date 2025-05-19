package com.chat.peter.service;

import com.chat.peter.model.Conversation;
import com.chat.peter.model.ConversationSummary;
import com.chat.peter.model.ChatMessage;
import com.chat.peter.repository.ConversationRepository;
import com.chat.peter.repository.MessageRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servicio para gestionar las conversaciones
 */
@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public ConversationService(ConversationRepository conversationRepository, MessageRepository messageRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }
    
    /**
     * Obtiene todas las conversaciones con su resumen
     */
    public List<ConversationSummary> getAllConversationSummaries() {
        List<Conversation> conversations = conversationRepository.findAll();
        List<ConversationSummary> summaries = new ArrayList<>();
        
        for (Conversation conversation : conversations) {
            List<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId());
            summaries.add(new ConversationSummary(conversation, messages));
        }
        
        return summaries;
    }
    
    /**
     * Obtiene los resúmenes de las conversaciones de un usuario
     */
    public List<ConversationSummary> getUserConversationSummaries(String userId) {
        List<Conversation> conversations = conversationRepository.findByUserId(userId);
        
        return conversations.stream()
                .map(conversation -> {
                    List<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId());
                    return new ConversationSummary(conversation, messages);
                })
                .collect(Collectors.toList());
    }
    
    /**
     * Obtiene el resumen de una conversación específica
     */
    public Optional<ConversationSummary> getConversationSummary(String conversationId) {
        Optional<Conversation> conversationOpt = conversationRepository.findById(conversationId);
        
        if (conversationOpt.isPresent()) {
            Conversation conversation = conversationOpt.get();
            List<ChatMessage> messages = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
            return Optional.of(new ConversationSummary(conversation, messages));
        }
        
        return Optional.empty();
    }
}
