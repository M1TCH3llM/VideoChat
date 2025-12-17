// src/main.jsx (or src/index.js)
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// --- NEW IMPORT ---
import setupAxiosInterceptor from './axios-config.js'; 

// --- CALL THE INTERCEPTOR SETUP ---
setupAxiosInterceptor(); 
// ----------------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);