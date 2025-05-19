package com.chat.peter.service;

import com.chat.peter.model.ChatMessage;
import com.chat.peter.model.Conversation;
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

import java.util.Optional;

@Service
public class AssistantService {

    private final ChatClient chatClient;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final MenuService menuService;
    
    // Instrucciones base para que la IA actúe como asistente de restaurante
    private final String BASE_INSTRUCTIONS = 
            "Eres un asistente virtual para el restaurante Banquetes Peter. Tu objetivo es ayudar a los clientes " +
            "con información precisa y breve sobre nuestro menú del día, horarios y recomendaciones. " +
            "Responde de forma concisa, directa y amable. Si el cliente pregunta por el menú, enfócate en ofrecer el menú del día y sus detalles principales. Evita respuestas largas o información innecesaria.";

    public AssistantService(ChatClient.Builder chatClient, 
                          ConversationRepository conversationRepository, 
                          MessageRepository messageRepository,
                          MenuService menuService) {
        this.chatClient = chatClient.build();
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.menuService = menuService;
    }
      /**
     * Procesa un mensaje del usuario y genera una respuesta
     */
    public ChatMessage processUserMessage(String userMessageContent, String conversationId, String userId) {
        // Obtener o crear una conversación
        Conversation conversation = getOrCreateConversation(conversationId, userId);
        
        // Crear y guardar el mensaje del usuario
        ChatMessage userMessage = new ChatMessage(userMessageContent, "user", conversation.getId());
        messageRepository.save(userMessage);
        
        // Actualizar timestamp de la conversación
        conversation.updateTimestamp();
        conversationRepository.save(conversation);
        
        // Generar la respuesta
        String aiResponse = generateAiResponse(conversation.getId());
        
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
     * Genera una respuesta de la IA basada en la conversación
     */
    private String generateAiResponse(String conversationId) {
        // Construir instrucciones completas con información de menús
        String menuInfo = menuService.getMenusDescription();
        String systemInstructions = BASE_INSTRUCTIONS + 
                "\n\nEsta es la información actual de nuestros menús:\n" + menuInfo;
        
        // Obtener los mensajes de la conversación
        List<ChatMessage> conversationMessages = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
        
        // Crear un nuevo prompt usando la API fluida
        return chatClient.prompt()
            .system(systemInstructions) // Configurar instrucciones del sistema
            .messages(createMessages(conversationMessages)) // Añadir mensajes previos
            .call() // Realizar la llamada al modelo
            .content(); // Obtener el contenido de la respuesta
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
