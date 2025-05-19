package com.chat.peter.repository;

import com.chat.peter.model.ChatMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<ChatMessage, String> {
    
    List<ChatMessage> findByConversationIdOrderByTimestampAsc(String conversationId);
    
    void deleteByConversationId(String conversationId);
}
