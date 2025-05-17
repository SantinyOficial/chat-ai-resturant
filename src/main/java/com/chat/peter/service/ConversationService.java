package com.chat.peter.service;

import com.chat.peter.model.Conversation;
import com.chat.peter.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;
import java.util.Optional;
import java.util.List;

@Service
public class ConversationService {
    @Autowired
    private MongoTemplate mongoTemplate;

    public Conversation saveConversation(Conversation conversation) {
        return mongoTemplate.save(conversation);
    }

    public Optional<Conversation> getConversationById(String id) {
        return Optional.ofNullable(mongoTemplate.findById(id, Conversation.class));
    }

    public List<Conversation> getAllConversations() {
        return mongoTemplate.findAll(Conversation.class);
    }
}
