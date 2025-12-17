package com.webrtc.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webrtc.handler.SignalingHandler;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/call")
public class SignalingController {
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private SignalingHandler signalingHandler; 

    // 1. INITIATE CALL (Jeff calls Bob)
    @PostMapping("/ring")
    public ResponseEntity<String> initiateCall(@RequestParam String receiver) {
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String senderUsername = authentication.getName();
        Long currentCallId = 1001L; 

        Map<String, Object> message = new HashMap<>();
        message.put("type", "CALL");
        message.put("action", "RING");
        message.put("sender", senderUsername);
        message.put("receiver", receiver);
        message.put("callId", currentCallId);

        try {
            String jsonMessage = objectMapper.writeValueAsString(message);
            // Route via WebSocket
            signalingHandler.sendMessageToUser(receiver, jsonMessage);
        } catch (Exception e) {
            System.err.println("Error routing RING: " + e.getMessage());
            return ResponseEntity.status(500).body("Error routing call.");
        }
        
        System.out.println("SERVER: Calling " + receiver + " from " + senderUsername);
        return ResponseEntity.ok("Ring sent to " + receiver);
    }

    // 2. ANSWER CALL (Bob answers Jeff) - NEW
    @PostMapping("/answer")
    public ResponseEntity<String> answerCall(@RequestParam Long callId, @RequestParam String caller) {
        System.out.println("SERVER: Call " + callId + " was ANSWERED by " + caller);
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "CALL");
        message.put("action", "ANSWERED");
        message.put("callId", callId);
        message.put("responder", SecurityContextHolder.getContext().getAuthentication().getName());

        // Tell the person who started the call (Jeff) that the receiver (Bob) answered
        signalingHandler.sendMessageToUser(caller, serialize(message));
        
        return ResponseEntity.ok("Call Answered on Server");
    }

    @PostMapping("/hangup")
    public ResponseEntity<String> hangupCall(@RequestParam Long callId, @RequestParam String peer) {
        System.out.println("SERVER: Call " + callId + " was ENDED. Notifying " + peer);
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "CALL");
        message.put("action", "HANGUP");
        message.put("callId", callId);

        // Notify the other participant to close their screen
        signalingHandler.sendMessageToUser(peer, serialize(message));
        
        return ResponseEntity.ok("Call Ended on Server");
    }

    // Helper for JSON
    private String serialize(Object obj) {
        try { return objectMapper.writeValueAsString(obj); } 
        catch (Exception e) { return ""; }
    }
}
