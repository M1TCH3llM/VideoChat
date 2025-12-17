// src/axios-config.js (or src/utils/axios-config.js)
import axios from 'axios';
import AuthService from './services/AuthService';

/**
 * Sets up a global interceptor to attach the JWT token to every outgoing request.
 * This guarantees the token is always sent, eliminating the 403 error cause.
 */
const setupAxiosInterceptor = () => {
    axios.interceptors.request.use(
        (config) => {
            const headers = AuthService.getAuthHeader();
            if (headers.Authorization) {
                config.headers.Authorization = headers.Authorization;
            }
            // Temporarily disable cache on POST requests to prevent conflicts
            if (config.method === 'post') {
                config.headers['Cache-Control'] = 'no-cache';
                config.headers['Pragma'] = 'no-cache';
                config.headers['Expires'] = '0';
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptor;