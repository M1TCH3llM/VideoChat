package com.webrtc.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
public class CallMetricsController {

    @PostMapping("/{callId}/transcript")
    public ResponseEntity<String> storeTranscript(
            @PathVariable Long callId,
            @RequestBody Map<String, Object> transcriptData) { // Accept Map/JSON
        
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String text = (String) transcriptData.get("text");
        
        System.out.println("--- TRANSCRIPTION API HIT ---");
        System.out.println("CALL ID: " + callId);
        System.out.println("USER: " + username);
        System.out.println("TEXT: " + text);
        System.out.println("-----------------------------");
        
        return ResponseEntity.ok("Transcription chunk saved.");
    }
}