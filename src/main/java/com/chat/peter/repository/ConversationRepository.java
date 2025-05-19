package com.chat.peter.repository;

import com.chat.peter.model.Conversation;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    
    List<Conversation> findByUserId(String userId);
    
    List<Conversation> findByCreatedAtAfter(LocalDateTime date);
}
