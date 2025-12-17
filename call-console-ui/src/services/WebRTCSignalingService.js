import AuthService from './AuthService';

const WS_URL = 'ws://localhost:8080/websocket-signaling';
const AUDIO_API_URL = 'http://localhost:8080/api/audio/transcribe'; 

let ws = null;
let localStream = null;
let isAiStreaming = false; 

// Audio Analysis
let audioContext = null;
let analyser = null;
let dataArray = null;

// --- TUNING CONFIGURATION ---
const MIN_CHUNK_TIME = 2000;  // Minimum recording length (2s)
const MAX_CHUNK_TIME = 8000;  // Increased max length to 8s (better context)
const SILENCE_THRESHOLD = 1500; // Wait 1.5s of silence before cutting (prevents chopping)
const VOLUME_THRESHOLD = 10;   // Lowered from 20 to 10 (picks up quiet speech better)

const connect = (username, onMessageReceived, onLocalStream) => {
    if (ws && ws.readyState === WebSocket.OPEN) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            localStream = stream;
            onLocalStream(stream);

            ws = new WebSocket(WS_URL);
            ws.onopen = () => { 
                ws.send(JSON.stringify({ type: 'REGISTER', username: username }));
            };
            ws.onmessage = (event) => {
                onMessageReceived(JSON.parse(event.data));
            };
        })
        .catch(error => console.error("Media Error: ", error));
};

const startAudioStreaming = () => {
    if (!localStream) {
        console.error("No stream to record");
        return;
    }
    
    // Setup Audio Analysis
    if (!audioContext) {
        setupAudioAnalysis();
    } else if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    if (isAiStreaming) return;
    
    isAiStreaming = true;
    console.log("Starting AI High-Fidelity Loop...");
    recordNextSmartChunk();
};

const setupAudioAnalysis = () => {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        const track = localStream.getAudioTracks()[0];
        const source = audioContext.createMediaStreamSource(new MediaStream([track]));
        source.connect(analyser);
    } catch (e) {
        console.error("Audio Context Setup Error:", e);
    }
};

const isSpeaking = () => {
    if (!analyser || !dataArray) return false;
    analyser.getByteFrequencyData(dataArray);
    
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    const average = sum / dataArray.length;
    
    // TUNED SENSITIVITY: Checks if volume is above 10 (Background noise is usually 0-5)
    return average > VOLUME_THRESHOLD; 
};

const recordNextSmartChunk = () => {
    if (!isAiStreaming || !localStream || !localStream.active) return;

    try {
        const originalTrack = localStream.getAudioTracks()[0];
        const clonedTrack = originalTrack.clone(); 
        const audioOnlyStream = new MediaStream([clonedTrack]);
        
        let mimeType = 'audio/webm;codecs=opus'; // Prefer Opus for best quality
        if (!MediaRecorder.isTypeSupported(mimeType)) {
             mimeType = 'audio/mp4'; // Fallback
        }

        // TUNED QUALITY: Force 128kbps bitrate for clearer audio
        const options = { 
            mimeType: mimeType,
            audioBitsPerSecond: 128000 
        };

        const recorder = new MediaRecorder(audioOnlyStream, options);
        const chunks = [];

        recorder.ondataavailable = (event) => {
            if (event.data.size > 0) chunks.push(event.data);
        };

        recorder.onstop = async () => {
            clonedTrack.stop(); 
            
            if (chunks.length > 0) {
                const audioBlob = new Blob(chunks, { type: mimeType });
                // Only send if > 3KB (ignores tiny blips)
                if (audioBlob.size > 3000) {
                    sendAudioToBackend(audioBlob);
                }
            }
            
            if (isAiStreaming) recordNextSmartChunk();
        };

        recorder.start();
        const startTime = Date.now();
        let silenceDuration = 0;

        const checkInterval = setInterval(() => {
            if (recorder.state !== 'recording') {
                clearInterval(checkInterval);
                return;
            }

            const currentDuration = Date.now() - startTime;
            
            if (isSpeaking()) {
                silenceDuration = 0; // Reset silence if talking
            } else {
                silenceDuration += 100; // Accumulate silence
            }

            // CUT LOGIC
            let shouldCut = false;

            // 1. Force cut if too long (8s)
            if (currentDuration >= MAX_CHUNK_TIME) {
                shouldCut = true;
            }
            // 2. Cut if pause detected (Wait 1.5s)
            else if (currentDuration >= MIN_CHUNK_TIME && silenceDuration >= SILENCE_THRESHOLD) {
                shouldCut = true;
            }

            if (shouldCut) {
                clearInterval(checkInterval);
                recorder.stop();
            }

        }, 100);

    } catch (e) {
        console.error("Recorder Error:", e);
        if (isAiStreaming) setTimeout(recordNextSmartChunk, 1000);
    }
};

const stopAudioStreaming = () => {
    isAiStreaming = false;
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        audioContext = null;
    }
    console.log("Stopped AI Streaming.");
};

const sendAudioToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'chunk.webm');
    
    const username = JSON.parse(localStorage.getItem('user'))?.username;
    formData.append('user', username);

    const headers = AuthService.getAuthHeader();
    
    try {
        await fetch(AUDIO_API_URL, {
            method: 'POST',
            headers: { ...headers }, 
            body: formData
        });
    } catch (error) { }
};

const disconnect = () => {
    stopAudioStreaming();
    if (ws) ws.close();
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
};

const WebRTCSignalingService = {
    connect,
    disconnect,
    startAudioStreaming,
    stopAudioStreaming
};

export default WebRTCSignalingService;