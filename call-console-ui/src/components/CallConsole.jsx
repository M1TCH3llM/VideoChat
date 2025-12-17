// src/components/CallConsole.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';
import WebRTCSignalingService from '../services/WebRTCSignalingService';
import CallService from '../services/CallService'; 

const CallConsole = ({ onLogout }) => {
    // 1. STATE
    const [callStatus, setCallStatus] = useState('Idle');
    const [transcript, setTranscript] = useState("AI Transcription will appear here...");
    const [message, setMessage] = useState('');
    const [targetUser, setTargetUser] = useState('');
    const [incomingCaller, setIncomingCaller] = useState(null); 
    
    // 2. REFS (Fixes "Stale Variable" bugs)
    const incomingCallerRef = useRef(null); 
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null); 
    const transcriptRef = useRef(null);

    const currentUser = JSON.parse(localStorage.getItem('user'))?.username || 'Guest';
    const mockCallId = 1001; 

    // ----------------------------------------------------
    // 3. HELPER FUNCTIONS
    // ----------------------------------------------------
    const handleLocalStream = useCallback((stream) => {
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
        }
    }, []);

    const handleSignalingMessage = useCallback((message) => {
    console.log("Incoming Message:", message);
    
    if (message.type === 'CALL') {
        switch (message.action) {
            case 'RING':
                incomingCallerRef.current = message.sender;
                setIncomingCaller(message.sender);
                setCallStatus('Ringing');
                setMessage(`INCOMING CALL from ${message.sender}!`);
                break;

            case 'ANSWERED':
                // This triggers for the SENDER when the receiver clicks Answer
                setCallStatus('Active');
                setTargetUser(message.responder); // Ensure name shows up
                setMessage(`Connected to ${message.responder}`);
                WebRTCSignalingService.startAudioStreaming();
                
                // Show "Remote" video (mocking by mirroring local for now)
                if (remoteVideoRef.current && localVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = localVideoRef.current.srcObject;
                }
                break;

            case 'HANGUP':
                // This triggers for User B when User A clicks Hang Up
                WebRTCSignalingService.stopAudioStreaming();
                setCallStatus('Idle');
                setIncomingCaller(null);
                incomingCallerRef.current = null;
                setTargetUser('');
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                setMessage("The other user ended the call.");
                break;
                
            default:
                break;
        }
    } else if (message.type === 'TRANSCRIPT') {
        setTranscript(prev => prev + "\n" + message.text);
    }
}, []);

    // Note: handleTranscriptionUpdate is no longer used for local speech api
    // We keep the useEffect clean.

    // ----------------------------------------------------
    // 4. CONNECTION EFFECT
    // ----------------------------------------------------
    useEffect(() => {
        const username = JSON.parse(localStorage.getItem('user'))?.username;
        
        WebRTCSignalingService.connect(
            username,
            handleSignalingMessage,
            handleLocalStream
            // Removed handleTranscriptionUpdate (using Server-Side AI now)
        );

        return () => {
            WebRTCSignalingService.disconnect();
        };
    }, [handleSignalingMessage, handleLocalStream]);

    // ----------------------------------------------------
    // 5. CALL ACTIONS
    // ----------------------------------------------------
    const mockCallAction = async (action) => {
        setMessage(`Processing ${action}...`);

        try {
            if (action === 'RING') {
                if (!targetUser || targetUser === currentUser) {
                    setMessage("Please enter a valid username to call.");
                    return;
                }
                await CallService.initiateCall(targetUser); 
                setCallStatus('Ringing');
                setMessage(`Calling ${targetUser}... Check Receiver's Browser!`);
            } 
            else if (action === 'ANSWER') {
                // Use Ref for safety
                const caller = incomingCallerRef.current;
                
                if (!caller) {
                    setMessage("Error: You cannot answer a call you initiated.");
                    return;
                }

                await CallService.answerCall(mockCallId, caller);
                
                setCallStatus('Active');
                setMessage(`Call Answered. Connected to ${caller}.`);
                
                // --- NEW: START AI RECORDING ---
                WebRTCSignalingService.startAudioStreaming();

                if (remoteVideoRef.current && localVideoRef.current.srcObject) {
                    remoteVideoRef.current.srcObject = localVideoRef.current.srcObject;
                }
            }
            else if (action === 'HANGUP') {
                const peerToNotify = incomingCallerRef.current || targetUser;

                await CallService.hangupCall(mockCallId, peerToNotify);
                
                // --- NEW: STOP AI RECORDING ---
                WebRTCSignalingService.stopAudioStreaming();
                
                setCallStatus('Idle');
                setIncomingCaller(null);
                incomingCallerRef.current = null;
                setTargetUser(''); 
                if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
                setMessage("Call Ended. Ready for new call.");
            }
        } catch (error) {
            console.error(error);
            setMessage(`Error during ${action}. Check console.`);
        }
    };

    return (
        <Container className="my-5">
            <Row>
                {/* VIDEO COLUMN */}
                <Col md={7}>
                    <Row>
                        <Col md={6}>
                            <Card className="mb-4">
                                <Card.Header>Local Stream ({currentUser})</Card.Header>
                                <Card.Body className="p-0 position-relative">
                                    <video 
                                        ref={localVideoRef} 
                                        autoPlay playsInline muted 
                                        style={{ width: '100%', borderRadius: '0.25rem' }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={6}>
                             <Card className="mb-4">
                                <Card.Header>Remote Stream ({incomingCaller || targetUser || 'Remote'})</Card.Header>
                                <Card.Body className="p-0 position-relative">
                                    <video 
                                        ref={remoteVideoRef} 
                                        autoPlay playsInline 
                                        style={{ 
                                            width: '100%', 
                                            borderRadius: '0.25rem',
                                            backgroundColor: callStatus === 'Active' ? 'black' : '#ccc'
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <Card>
                        <Card.Body>
                            {message && <Alert variant="info" className="mt-2">{message}</Alert>}
                            
                            <div className="text-center">
                                {callStatus === 'Idle' && (
                                    <Form className="d-flex gap-2" onSubmit={(e) => { e.preventDefault(); mockCallAction('RING'); }}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Enter Username (e.g., Bob)"
                                            value={targetUser}
                                            onChange={(e) => setTargetUser(e.target.value)}
                                            required
                                        />
                                        <Button variant="success" type="submit" style={{ minWidth: '120px' }}>
                                            📞 Call
                                        </Button>
                                    </Form>
                                )}

                                {callStatus !== 'Idle' && (
                                    <div>
                                        <h6 className={`text-${callStatus === 'Ringing' ? 'warning' : 'success'} my-3`}>
                                            Status: {callStatus} {incomingCaller && `from ${incomingCaller}`}
                                        </h6>
                                        
                                        {/* Only show Answer button if we are the Receiver */}
                                        {incomingCaller && (
                                            <Button 
                                                variant="success" 
                                                onClick={() => mockCallAction('ANSWER')} 
                                                disabled={callStatus !== 'Ringing'}
                                                className="mx-2"
                                            >
                                                Answer Call
                                            </Button>
                                        )}
                                        
                                        <Button 
                                            variant="danger" 
                                            onClick={() => mockCallAction('HANGUP')}
                                            className="mx-2"
                                        >
                                            Hang Up
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>

                {/* TRANSCRIPTION COLUMN */}
                <Col md={5}>
                    <Card>
                        <Card.Header as="h5">AI Transcription (Server-Side)</Card.Header>
                        <Card.Body>
                            <p className="mb-2 text-muted">Status: <span className="text-success">{callStatus === 'Active' ? 'Streaming Audio to AI...' : 'Idle'}</span></p>
                            <div 
                                ref={transcriptRef}
                                style={{ 
                                    height: '300px', 
                                    overflowY: 'scroll', 
                                    border: '1px solid #ccc', 
                                    padding: '10px', 
                                    backgroundColor: '#f8f9fa' 
                                }}
                            >
                                {transcript}
                            </div>
                        </Card.Body>
                        <Card.Footer className="d-flex justify-content-between">
                            <span className="text-muted small">Sent to /api/audio/transcribe</span>
                            {/* HERE IS THE LOGOUT BUTTON */}
                            <Button variant="outline-danger" size="sm" onClick={onLogout}>Logout</Button>
                        </Card.Footer>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default CallConsole;