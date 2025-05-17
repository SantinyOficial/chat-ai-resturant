package com.chat.peter.service;

import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    public void notifyWaiter(String conversationId, String orderDetails) {
        // Aquí iría la lógica para notificar al mesero (por ejemplo, por WebSocket, email, push, etc.)
        System.out.println("Notificando al mesero sobre el pedido: " + orderDetails + " en la conversación: " + conversationId);
    }
}
