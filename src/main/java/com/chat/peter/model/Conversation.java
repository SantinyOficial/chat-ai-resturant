package com.chat.peter.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "conversations")
public class Conversation {
    @Id
    private String id;
    private String customerId;
    private List<Message> messages;
    private boolean notifiedWaiter;
    // getters y setters
}
