package com.webrtc.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ThreadLocalRandom;

/**
 * Simulates a complex Natural Language Processing (NLP) microservice.
 * This service handles intent detection and confidence scoring.
 */
@Service
public class NlpService {

    /**
     * EPIC E2: Analyzes text for greetings and intent detection.
     * @param text The transcription chunk to analyze.
     * @return true if a greeting is detected.
     */
    public boolean detectGreetingAndIntent(String text) {
        // --- MOCK LOGIC ---
        String lowerText = text.toLowerCase();
        
        // Simple heuristic to mock detection (EPIC E6.1)
        if (lowerText.contains("hello") || lowerText.contains("hi there") || lowerText.contains("good morning")) {
            return true;
        }
        
        // Mock intent: "I need help" or "Can you assist"
        if (lowerText.contains("need help") || lowerText.contains("assist")) {
            System.out.println("NLP: DETECTED PRIMARY INTENT: ASSISTANCE REQUESTED");
        }
        
        return false;
    }

    /**
     * EPIC E3: Simulates confidence scoring for AI outputs.
     * @return A random confidence score between 0.0 and 1.0.
     */
    public double getConfidenceScore() {
        // --- MOCK LOGIC ---
        // Simulates the LLM or STT engine providing a metric (EPIC E7.1)
        return ThreadLocalRandom.current().nextDouble(0.4, 1.0);
    }
    
    /**
     * Determines if a confidence score is low enough to be flagged as a hallucination risk.
     * @param score The confidence score.
     * @return true if confidence is below a low threshold.
     */
    public boolean isHallucinationRisk(double score) {
        // MOCK THRESHOLD (EPIC E7.2)
        return score < 0.65;
    }
}