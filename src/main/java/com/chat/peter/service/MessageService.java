package com.chat.peter.service;

import com.chat.peter.model.Message;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.mongodb.core.MongoTemplate;
import java.util.List;

@Service
public class MessageService {
    @Autowired
    private MongoTemplate mongoTemplate;

    public Message saveMessage(Message message) {
        return mongoTemplate.save(message);
    }

    public List<Message> getMessagesByConversationId(String conversationId) {
        return mongoTemplate.find(
            new org.springframework.data.mongodb.core.query.Query(
                org.springframework.data.mongodb.core.query.Criteria.where("conversationId").is(conversationId)
            ),
            Message.class
        );
    }
}
