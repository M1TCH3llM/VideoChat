// src/services/AuthService.js
import axios from "axios";

const API_URL = "http://localhost:8080/auth";

const login = async (username, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            username,
            password,
        });
        if(response.data.token) {
            localStorage.setItem("user", JSON.stringify(response.data));
        }
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

const logout = () => {
    localStorage.removeItem("user");
};

const getCurrentUserToken = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
        const user = JSON.parse(userStr);
        return user?.token;
    } catch (e) {
        console.error("Error parsing user from local storage", e);
        return null;
    }
}

const getAuthHeader = () => {
    const token = getCurrentUserToken();
    if(token) {
        // Log to confirm token exists (Remove this after fixing)
        console.log("Adding Auth Token to Header:", token.substring(0, 10) + "..."); 
        return { Authorization: 'Bearer ' + token };
    } else {
        console.warn("No token found in LocalStorage!");
        return {};
    }
};

const AuthService = {
    login,
    logout,
    getCurrentUserToken,
    getAuthHeader,
};

export default AuthService;