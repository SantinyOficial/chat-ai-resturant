package com.chat.peter.service;

import com.chat.peter.model.ChatMessage;
import com.chat.peter.model.Conversation;
import com.chat.peter.model.UserMessageRequest;
import com.chat.peter.repository.ConversationRepository;
import com.chat.peter.repository.MessageRepository;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.SystemPromptTemplate;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssistantService {

    private final ChatClient chatClient;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MenuService menuService;
    private final PedidoService pedidoService;
    
    // Instrucciones base para que la IA actúe como asistente de restaurante
    private final String BASE_INSTRUCTIONS = 
            "Eres un asistente virtual para el restaurante Banquetes Peter. Tu objetivo es ayudar a los clientes " +
            "con información precisa y breve sobre nuestro menú del día, horarios, recomendaciones y estado de sus pedidos. " +
            "Responde de forma concisa, directa y amable. Si el cliente pregunta por el menú, enfócate en ofrecer el menú del día y sus detalles principales. " +
            "Si el cliente pregunta por sus pedidos, ofrece información sobre su estado actual. " +
            "Si el cliente quiere realizar un pedido, indícale que puede hacerlo directamente contigo. " +
            "Evita respuestas largas o información innecesaria.";

    public AssistantService(ChatClient.Builder chatClient, 
                          ConversationRepository conversationRepository, 
                          MessageRepository messageRepository,
                          MenuService menuService,
                          PedidoService pedidoService) {
        this.chatClient = chatClient.build();
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.menuService = menuService;
        this.pedidoService = pedidoService;
    }
    
    /**
     * Procesa un mensaje del usuario y genera una respuesta
     */
    public ChatMessage processUserMessage(String userMessageContent, String conversationId, String userId) {
        return processUserMessageWithContext(userMessageContent, conversationId, userId, null);
    }

    /**
     * Procesa un mensaje del usuario con contexto adicional (información de pedidos)
     */
    public ChatMessage processUserMessageWithContext(String userMessageContent, String conversationId, 
                                                     String userId, UserMessageRequest.PedidoInfo pedidoInfo) {
        // Obtener o crear una conversación
        Conversation conversation = getOrCreateConversation(conversationId, userId);
        
        // Crear y guardar el mensaje del usuario
        ChatMessage userMessage = new ChatMessage(userMessageContent, "user", conversation.getId());
        messageRepository.save(userMessage);
        
        // Actualizar timestamp de la conversación
        conversation.updateTimestamp();
        conversationRepository.save(conversation);
        
        // Generar la respuesta considerando la información de pedidos
        String aiResponse = generateAiResponse(conversation.getId(), pedidoInfo);
        
        // Crear y guardar el mensaje del asistente
        ChatMessage assistantMessage = new ChatMessage(aiResponse, "assistant", conversation.getId());
        messageRepository.save(assistantMessage);
        
        return assistantMessage;
    }
    
    /**
     * Obtiene una conversación existente o crea una nueva
     */
    private Conversation getOrCreateConversation(String conversationId, String userId) {
        if (conversationId != null) {
            Optional<Conversation> existingConversation = conversationRepository.findById(conversationId);
            if (existingConversation.isPresent()) {
                return existingConversation.get();
            }
        }
        
        Conversation newConversation = new Conversation(userId);
        return conversationRepository.save(newConversation);
    }
    
    /**
     * Obtiene una conversación por su ID
     */
    public Optional<Conversation> getConversation(String conversationId) {
        return conversationRepository.findById(conversationId);
    }
    
    /**
     * Obtiene todas las conversaciones
     */
    public List<Conversation> getAllConversations() {
        return conversationRepository.findAll();
    }
    
    /**
     * Obtiene todas las conversaciones de un usuario
     */
    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findByUserId(userId);
    }
      /**
     * Obtiene los mensajes de una conversación
     */
    public List<ChatMessage> getConversationMessages(String conversationId) {
        return messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
    }
    
    /**
     * Genera una respuesta de la IA basada en la conversación y la información de pedidos
     */
    private String generateAiResponse(String conversationId, UserMessageRequest.PedidoInfo pedidoInfo) {
        // Construir instrucciones completas con información de menús y pedidos
        String menuInfo = menuService.getMenusDescription();
        StringBuilder systemInstructions = new StringBuilder(BASE_INSTRUCTIONS);
        
        systemInstructions.append("\n\nEsta es la información actual de nuestros menús:\n").append(menuInfo);
        
        // Añadir información de pedidos si está disponible
        if (pedidoInfo != null) {
            systemInstructions.append("\n\nInformación sobre los pedidos del cliente:\n");
            if (pedidoInfo.isHasPedidos()) {
                systemInstructions.append("- El cliente tiene ").append(pedidoInfo.getPedidoCount()).append(" pedido(s).\n");
                
                if (pedidoInfo.getLastPedidoId() != null) {
                    systemInstructions.append("- Su pedido más reciente (ID: ")
                        .append(pedidoInfo.getLastPedidoId()).append(") ");
                    
                    if (pedidoInfo.getLastPedidoStatus() != null) {
                        String readableStatus = getReadableStatus(pedidoInfo.getLastPedidoStatus());
                        systemInstructions.append("está actualmente en estado: ").append(readableStatus).append(".\n");
                        
                        // Añadir estimaciones de tiempo según el estado
                        switch (pedidoInfo.getLastPedidoStatus()) {
                            case "PENDIENTE":
                                systemInstructions.append("- El pedido será aceptado en breve por nuestro personal.\n");
                                break;
                            case "EN_PREPARACION":
                                systemInstructions.append("- El pedido está siendo preparado y tardará aproximadamente 15-20 minutos.\n");
                                break;
                            case "LISTO":
                                systemInstructions.append("- El pedido está listo y será entregado en breve.\n");
                                break;
                        }
                    }
                }
            } else {
                systemInstructions.append("- El cliente no tiene pedidos previos.\n");
                systemInstructions.append("- Puedes ofrecerle ayuda para realizar su primer pedido.\n");
            }
        }
        
        // Obtener los mensajes de la conversación
        List<ChatMessage> conversationMessages = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        
        // Crear un nuevo prompt usando la API fluida
        return chatClient.prompt()
            .system(systemInstructions.toString()) // Configurar instrucciones del sistema
            .messages(createMessages(conversationMessages)) // Añadir mensajes previos
            .call() // Realizar la llamada al modelo
            .content(); // Obtener el contenido de la respuesta
    }
    
    /**
     * Convierte el estado técnico a un formato más legible
     */
    private String getReadableStatus(String status) {
        switch (status) {
            case "PENDIENTE":
                return "Pendiente";
            case "EN_PREPARACION":
                return "En preparación";
            case "LISTO":
                return "Listo para entregar";
            case "ENTREGADO":
                return "Entregado";
            case "CANCELADO":
                return "Cancelado";
            default:
                return status;
        }
    }
    
    /**
     * Convierte los mensajes almacenados en mensajes para el ChatClient
     */
    private List<Message> createMessages(List<ChatMessage> conversationMessages) {
        List<Message> messages = new ArrayList<>();
        
        // Limitar a los últimos 10 mensajes para evitar tokens excesivos
        int startIndex = Math.max(0, conversationMessages.size() - 10);
        
        for (int i = startIndex; i < conversationMessages.size(); i++) {
            ChatMessage msg = conversationMessages.get(i);
            if ("user".equals(msg.getRole())) {
                messages.add(new UserMessage(msg.getContent()));
            } else if ("assistant".equals(msg.getRole())) {
                // Usar SystemMessage para mensajes del asistente
                messages.add(new SystemMessage(msg.getContent()));
            }
        }
        
        return messages;
    }
      /**
     * Elimina una conversación y sus mensajes
     */
    public void deleteConversation(String conversationId) {
        messageRepository.deleteByConversationId(conversationId);
        conversationRepository.deleteById(conversationId);
    }
}
