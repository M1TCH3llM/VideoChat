// src/services/CallService.js
import axios from 'axios';
import AuthService from './AuthService'; 

const API_URL = 'http://localhost:8080/call';

// Helper to get headers
const getConfig = () => {
    return { headers: AuthService.getAuthHeader() };
};

const initiateCall = (receiver) => {
    return axios.post(`${API_URL}/ring`, null, { 
        params: { receiver },
        ...getConfig() 
    });
};

const answerCall = (callId, callerUsername) => {
    // 1. Debugging Log
    console.log(`Attempting to answer call. ID: ${callId}, Caller: ${callerUsername}`);

    // 2. Prevent sending bad requests
    if (!callerUsername) {
        console.error("Cannot answer call: 'callerUsername' is missing!");
        return Promise.reject("Caller username is missing");
    }

    return axios.post(`${API_URL}/answer`, null, { 
        params: { 
            callId: callId,
            caller: callerUsername 
        },
        ...getConfig() 
    });
};

const hangupCall = (callId, peerUsername) => {
    return axios.post(`${API_URL}/hangup`, null, { 
        params: { 
            callId: callId,
            peer: peerUsername 
        },
        ...getConfig() 
    });
};

const CallService = {
    initiateCall,
    answerCall,
    hangupCall
};

export default CallService;