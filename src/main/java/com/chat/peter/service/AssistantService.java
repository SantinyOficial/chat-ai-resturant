package com.chat.peter.service;

import org.springframework.ai.chat.client.ChatClient;

public class AssistantService {

    private final ChatClient chatClient;
    private final ContextService contextService;

    public AssistantService(ChatClient.Builder chatClient, ContextService contextService) {
        this.contextService = contextService;
        this.chatClient = chatClient.build();
    }



    

}
