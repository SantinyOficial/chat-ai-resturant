package com.chat.peter.service;

import org.springframework.ai.client.AiClient;
import org.springframework.ai.client.Generation;
import org.springframework.ai.prompt.PromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AIService {
    
    @Value("${spring.ai.openai.api-key}")
    private String apiKey;

    private final AiClient aiClient;

    public AIService(AiClient aiClient) {
        this.aiClient = aiClient;
    }

    public String getAIResponse(String userMessage) {
        Generation generation = aiClient.generate(userMessage);
        return generation.getText();
    }
}
