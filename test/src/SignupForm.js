import React, { useState } from 'react';

const SignupForm = ({ setMessage }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!username || !password) {
      setMessage('Please provide a username and password.');
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error('Signup failed');
      }

      const data = await response.json();
      setMessage('Signup successful');

    } catch (error) {
      setMessage('Signup failed. This username may already exist.');
      console.error('Error signing up:', error);
    }
  };

  return (

 
    
    <div className="signup">
      <h2 >Sign Up</h2>
      <div>
        <input
          type="text"
          className="form__field"
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
      <button className="buttons" onClick={handleSignup}>Sign Up</button>
    </div>
  );
};

export default SignupForm;