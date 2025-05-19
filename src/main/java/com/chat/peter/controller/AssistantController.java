package com.chat.peter.controller;

import com.chat.peter.model.ChatMessage;
import com.chat.peter.model.ChatResponse;
import com.chat.peter.model.Conversation;
import com.chat.peter.model.ConversationSummary;
import com.chat.peter.model.UserMessageRequest;
import com.chat.peter.service.AssistantService;
import com.chat.peter.service.ConversationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador para manejar las interacciones con el asistente virtual
 */
@RestController
@RequestMapping("/api/assistant")
@CrossOrigin(origins = "*") // Permitir solicitudes desde cualquier origen
public class AssistantController {

    private final AssistantService assistantService;
    private final ConversationService conversationService;

    public AssistantController(AssistantService assistantService, ConversationService conversationService) {
        this.assistantService = assistantService;
        this.conversationService = conversationService;
    }

    /**
     * Endpoint para enviar un mensaje al asistente y recibir una respuesta
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@RequestBody UserMessageRequest request) {
        // Determinar si se está creando una nueva conversación
        boolean isNewConversation = request.getConversationId() == null;
        
        // Procesar el mensaje
        ChatMessage responseMessage = assistantService.processUserMessage(
                request.getMessage(), 
                request.getConversationId(),
                request.getUserId()
        );
        
        // Obtener el ID de la conversación (que puede ser nuevo)
        String conversationId = responseMessage.getConversationId();
        
        // Construir y devolver la respuesta
        ChatResponse response = new ChatResponse(responseMessage, conversationId, isNewConversation);
        return ResponseEntity.ok(response);
    }    /**
     * Endpoint para obtener todas las conversaciones con resumen
     */
    @GetMapping("/conversations/summaries")
    public ResponseEntity<List<ConversationSummary>> getAllConversationSummaries() {
        return ResponseEntity.ok(conversationService.getAllConversationSummaries());
    }
    
    /**
     * Endpoint para obtener resúmenes de conversaciones de un usuario específico
     */
    @GetMapping("/conversations/summaries/user/{userId}")
    public ResponseEntity<List<ConversationSummary>> getUserConversationSummaries(@PathVariable String userId) {
        return ResponseEntity.ok(conversationService.getUserConversationSummaries(userId));
    }
    
    /**
     * Endpoint para obtener resumen de una conversación específica
     */
    @GetMapping("/conversations/summaries/{id}")
    public ResponseEntity<ConversationSummary> getConversationSummary(@PathVariable String id) {
        Optional<ConversationSummary> summary = conversationService.getConversationSummary(id);
        return summary.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Endpoint para obtener todas las conversaciones
     */
    @GetMapping("/conversations")
    public ResponseEntity<List<Conversation>> getAllConversations() {
        return ResponseEntity.ok(assistantService.getAllConversations());
    }

    /**
     * Endpoint para obtener conversaciones de un usuario específico
     */
    @GetMapping("/conversations/user/{userId}")
    public ResponseEntity<List<Conversation>> getUserConversations(@PathVariable String userId) {
        return ResponseEntity.ok(assistantService.getUserConversations(userId));
    }

    /**
     * Endpoint para obtener una conversación específica
     */
    @GetMapping("/conversations/{id}")
    public ResponseEntity<Conversation> getConversation(@PathVariable String id) {
        Optional<Conversation> conversation = assistantService.getConversation(id);
        return conversation.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    /**
     * Endpoint para obtener los mensajes de una conversación
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<List<ChatMessage>> getConversationMessages(@PathVariable String id) {
        List<ChatMessage> messages = assistantService.getConversationMessages(id);
        return ResponseEntity.ok(messages);
    }
    
    /**
     * Endpoint para eliminar una conversación
     */
    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> deleteConversation(@PathVariable String id) {
        assistantService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Endpoint de salud para verificar que el servicio está funcionando
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        return ResponseEntity.ok(Map.of("status", "UP", "message", "El asistente virtual está disponible"));
    }
}

