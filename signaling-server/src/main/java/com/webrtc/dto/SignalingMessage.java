package com.webrtc.dto;

import lombok.Data;

@Data
public class SignalingMessage {
	private String type;
	private String sender;
	private String receiver;
	private String content;
	private Long callId;
}
