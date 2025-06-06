package com.chat.peter.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.mistralai.MistralAiChatModel;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración para los servicios de IA con Mistral AI
 */
@Configuration
public class AIConfig {

    /**
     * Bean para ChatClient.Builder usando Mistral AI
     */
    @Bean
    public ChatClient.Builder chatClientBuilder(MistralAiChatModel chatModel) {
        return ChatClient.builder(chatModel);
    }
}