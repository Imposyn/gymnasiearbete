import React, { useState } from 'react';
import './App.css';


const LoginForm = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(null); // New state for messages

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: username,
          password: password,
        }),
      });

      if (!response.ok) {
        console.error('Login request failed:', response.status, response.statusText);
        throw new Error('Login failed');
      }

      const data = await response.json();

      window.alert('Login successful'); // Display success message as an alert

      // Call the parent component's login handler with the token
      onLogin(true, data.token);
    } catch (error) {
      setMessage('Login failed, wrong password or wrong username'); // Set the error message
      console.error('Error logging in:', error);
    }
  };

  return (
    <aside className="login">
      <h2>Login</h2>
      <div>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button className="buttons" onClick={handleLogin}>Login</button>
      {message && (
        <div className={message.includes('successful') ? 'success-message' : 'error-message'}>
          {message}
        </div>
      )}
    </aside>
  );
};

export default LoginForm;