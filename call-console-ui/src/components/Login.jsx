// src/components/Login.jsx

import React, {useState} from "react";
import {Card, Form, Button, Alert } from 'react-bootstrap';
import AuthService from "../services/AuthService";

const Login = ({onLoginSuccess}) => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!username || !password) {
            setError("User name & Password are required");
            setLoading(false);
            return;
        }

        try {
            await AuthService.login(username, password);
            await new Promise(resolve => setTimeout(resolve, 500));
            onLoginSuccess();
        } catch (err) {
            // Fixed: use err.response.status, not ErrorEvent
            if (err.response && err.response.status === 401) {
                setError("Login failed. Check your credentials.");
            } else {
                setError("An error occurred during login. Please try again later.");
            }
        } finally {
            setLoading(false);
        };
    };

    return (
        <Card style={{ width: '25rem', margin: '5rem auto'}}> 
            <Card.Header as="h5" className="text-center">Call Login</Card.Header>
            <Card.Body>
                {error && <Alert variant='danger'>{error}</Alert>}

                <Form onSubmit={handleLogin}>
                    <Form.Group className="mb-3">
                        <Form.Label>User Name</Form.Label>
                        <Form.Control
                            type="text"
                            value= {username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            placeholder="Enter user name"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <Form.Control
                            type="password"
                            value= {password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder="Enter user password"
                        />
                    </Form.Group>

                    <Button variant="primary" type="submit" disabled={loading} className="w-100">
                        {loading ? "Logging in..." : "Login"}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default Login;