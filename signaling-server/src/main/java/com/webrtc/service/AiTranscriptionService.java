package com.webrtc.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import java.util.Arrays;
import java.util.List;

@Service
public class AiTranscriptionService {

    @Value("${openai.api.key}")
    private String apiKey;

    @Value("${openai.api.url}")
    private String apiUrl;

    @Value("${openai.model}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // LIST OF BANNED PHRASES (Hallucinations)
    private static final List<String> BANNED_PHRASES = Arrays.asList(
        "thank you", "thanks", "bye", "peace", "shush", "okay", 
        "silence", "you", "copyright", "mbc news", "subtitles", 
        "watching", "amara.org", "closed captioning", "dick",
        "transcribed by https://otter.ai"
    );

    public String transcribeAudio(MultipartFile audioFile) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            headers.setBearerAuth(apiKey);

            ByteArrayResource fileResource = new ByteArrayResource(audioFile.getBytes()) {
                @Override
                public String getFilename() { return "audio.webm"; }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);
            body.add("model", model);
            body.add("language", "en");
            body.add("temperature", 0);
            
            // CHANGED PROMPT: "Silence" triggers hallucinations. 
            // We give it a real context instead to keep it focused.
            body.add("prompt", "This is a live technical meeting transcript."); 

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(apiUrl, requestEntity, String.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String text = root.path("text").asText();
                
                // CRITICAL FIX: Aggressive Filtering
                if (shouldIgnore(text)) {
                    return ""; 
                }
                
                return text;
            } else {
                return "";
            }

        } catch (Exception e) {
            System.err.println("OpenAI Error: " + e.getMessage());
            return ""; 
        }
    }

    // STRICT FILTER LOGIC
    private boolean shouldIgnore(String text) {
        if (text == null || text.trim().isEmpty()) return true;
        
        String clean = text.trim().toLowerCase();
        
        // 1. Remove trailing punctuation for checking
        if (clean.endsWith(".")) clean = clean.substring(0, clean.length() - 1);
        
        // 2. IGNORE VERY SHORT GARBAGE (1-2 characters)
        // This stops "." or ".." or "Oh"
        if (clean.length() <= 2) return true;

        // 3. CHECK AGAINST BANNED PHRASES
        // If the *entire* text is just a banned phrase (e.g., "Thank you."), block it.
        for (String banned : BANNED_PHRASES) {
            if (clean.equals(banned) || clean.startsWith(banned + ".") || clean.equals(banned + ".")) {
                return true;
            }
        }
        
        // 4. CHECK FOR REPETITION LOOP ("Thank you. Thank you. Thank you.")
        // If the text repeats the word "thank" more than once, it's a hallucination loop.
        if (countOccurrences(clean, "thank") > 1) return true;

        // Otherwise, it's real speech
        return false;
    }
    
    private int countOccurrences(String str, String word) {
        return str.split(word, -1).length - 1;
    }
}