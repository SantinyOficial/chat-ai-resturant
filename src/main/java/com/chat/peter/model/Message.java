package com.chat.peter.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String conversationId;
    private String sender; // "cliente", "asistente", "mesero"
    private String content;
    private LocalDateTime timestamp;
    // getters y setters
}
