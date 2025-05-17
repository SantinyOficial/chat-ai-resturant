package com.chat.peter.controller;

import com.chat.peter.model.Conversation;
import com.chat.peter.model.Message;
import com.chat.peter.service.AIService;
import com.chat.peter.service.ConversationService;
import com.chat.peter.service.MessageService;
import com.chat.peter.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    @Autowired
    private ConversationService conversationService;
    @Autowired
    private MessageService messageService;
    @Autowired
    private AIService aiService;
    @Autowired
    private NotificationService notificationService;

    @PostMapping("/message")
    public Message sendMessage(@RequestBody Message message) {
        messageService.saveMessage(message);
        // Obtener contexto de la conversación
        Optional<Conversation> conversationOpt = conversationService.getConversationById(message.getConversationId());
        Conversation conversation = conversationOpt.orElse(new Conversation());
        // Lógica de IA
        String aiResponse = aiService.getAIResponse(message.getContent());
        // Guardar respuesta de IA
        Message aiMessage = new Message();
        aiMessage.setConversationId(message.getConversationId());
        aiMessage.setSender("asistente");
        aiMessage.setContent(aiResponse);
        aiMessage.setTimestamp(java.time.LocalDateTime.now());
        messageService.saveMessage(aiMessage);
        // Notificar al mesero si es un pedido
        if (message.getContent().toLowerCase().contains("pedido")) {
            notificationService.notifyWaiter(message.getConversationId(), message.getContent());
        }
        return aiMessage;
    }

    @GetMapping("/conversation/{id}")
    public List<Message> getConversation(@PathVariable String id) {
        return messageService.getMessagesByConversationId(id);
    }
}
