// File: client/src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://ghost-backend-fq2h.onrender.com/api/auth/login', {
        email,
        password
      });

      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError('ACCESS DENIED: INVALID CREDENTIALS');
    }
  };

  return (
    <div className="auth-container">
      <h2>🔐 IDENTITY VERIFICATION</h2>
      {error && <div style={{ color: 'red', border: '1px solid red', padding: '10px', marginBottom: '20px' }}>{error}</div>}

      <form onSubmit={handleLogin}>
        <input
          className="spy-input"
          type="email"
          placeholder="AGENT EMAIL"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="spy-input"
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" className="spy-btn btn-primary">
          AUTHENTICATE
        </button>
      </form>

      <p className="link-text" onClick={() => navigate('/register')}>
        NO ID? REGISTER HERE
      </p>
    </div>
  );
};

export default Login;