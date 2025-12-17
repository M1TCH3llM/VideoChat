package com.webrtc.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.webrtc.handler.SignalingHandler; // Import this
import com.webrtc.service.AiTranscriptionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    @Autowired
    private AiTranscriptionService aiService;

    @Autowired
    private SignalingHandler signalingHandler; // <--- NEW: To talk back to React

    @Autowired
    private ObjectMapper objectMapper;

    @PostMapping("/transcribe")
    public ResponseEntity<String> receiveAudioChunk(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam("user") String username) {

        if (audioFile.isEmpty()) return ResponseEntity.badRequest().body("Empty audio");

        // 1. Get Text from AI
        String transcript = aiService.transcribeAudio(audioFile);
        
        System.out.println("AI TRANSCRIPT RESULT: " + transcript);

        // 2. SEND BACK TO FRONTEND VIA WEBSOCKET
        // We ignore "Thank you for watching" hallucinations to keep UI clean
        if (transcript != null && !transcript.trim().isEmpty() && 
            !transcript.contains("Thank you for watching") && 
            !transcript.contains("Дякую")) {
            
            try {
                Map<String, Object> message = new HashMap<>();
                message.put("type", "TRANSCRIPT");
                message.put("text", transcript);
                message.put("sender", "AI");

                String jsonMessage = objectMapper.writeValueAsString(message);
                
                // Send to the user who spoke (so they see their own text)
                // Optionally: You could also send to the 'receiver' if you passed that info
                signalingHandler.sendMessageToUser(username, jsonMessage);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        return ResponseEntity.ok(transcript);
    }
}