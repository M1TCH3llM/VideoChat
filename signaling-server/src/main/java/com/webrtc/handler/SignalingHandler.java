package com.webrtc.handler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;
import java.util.Map;


 // Handles WebRTC Signaling and manages Username to Session mapping.
 
@Component
public class SignalingHandler extends TextWebSocketHandler {

    // Key=Username, Value=WebSocketSession
    private final Map<String, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    
    // Key=Session ID, Value=Username
    private final Map<String, String> sessionToUser = new ConcurrentHashMap<>(); 
    
    @Autowired
    private ObjectMapper objectMapper;

    //  Incoming Message Router
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        
     
        Map<String, String> messageMap = objectMapper.readValue(payload, Map.class);
        String type = messageMap.get("type");
        String sender = messageMap.get("sender");

        if ("REGISTER".equalsIgnoreCase(type)) {
            // A user is registering their session after successful login (Jeff or Bob)
            String username = messageMap.get("username");
            userSessions.put(username, session);
            sessionToUser.put(session.getId(), username);
            System.out.println("SERVER: User Registered: " + username + ". Total Sessions: " + userSessions.size());
            
        } else if ("CALL".equalsIgnoreCase(type)) {
            // A user is trying to send a call request (Jeff calling Bob)
            String receiver = messageMap.get("receiver");
            String action = messageMap.get("action"); // e.g., RING, OFFER, ANSWER

            // Route the message from Jeff to Bob
            sendMessageToUser(receiver, payload);
            
            System.out.println("SERVER: ROUTING CALL MESSAGE: " + action + " from " + sender + " to " + receiver);
        }
    }
    
    //  Connection Closed 
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        // Find the username associated with this session ID and remove both entries
        String username = sessionToUser.remove(session.getId());
        if (username != null) {
            userSessions.remove(username);
            System.out.println("SERVER: User Disconnected: " + username + ". Remaining: " + userSessions.size());
        }
    }
    
    //  Helper Method 
    public void sendMessageToUser(String username, String message) {
        WebSocketSession session = userSessions.get(username);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
                System.out.println("SERVER: Successfully routed message to " + username);
            } catch (Exception e) {
                System.err.println("Error sending message to user " + username + ": " + e.getMessage());
            }
        } else {
            System.out.println("SERVER: ERROR - User " + username + " not online or session closed.");
        }
    }
}