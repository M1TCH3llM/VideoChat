import { useState, useEffect, useCallback } from 'react'
import Login from './components/Login';
import CallConsole from './components/CallConsole';
import AuthService from './services/AuthService';

function App() {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUserToken());

  const handleLoginSuccess = useCallback(() => {
    setCurrentUser(AuthService.getCurrentUserToken());
  }, []);

  const handleLogout = useCallback(() => {
        AuthService.logout();
        setCurrentUser(null);
    }, []);

  return (
    <div className="App">
        {currentUser ? (
           
            <CallConsole onLogout={handleLogout} /> 
        ) : (
            <Login onLoginSuccess={handleLoginSuccess} />
        )}
    </div>
  );
}

export default App
