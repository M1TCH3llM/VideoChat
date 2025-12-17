package com.webrtc.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.webrtc.handler.SignalingHandler;

@Configuration
@EnableWebSocket 
public class WebSocketConfig implements WebSocketConfigurer {

	@Autowired
	private SignalingHandler signalingHandler;
	
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(signalingHandler, "/websocket-signaling")
                .setAllowedOrigins("*"); // Allows connections from our React server
    }
}