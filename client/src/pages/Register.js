// File: client/src/pages/Register.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', safePin: '', panicPin: '', adminPin: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('https://ghost-backend-fq2h.onrender.com/api/auth/register', formData);
      localStorage.setItem('userInfo', JSON.stringify(data));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'REGISTRATION FAILED');
    }
  };

  return (
    <div className="auth-container">
      <h2>📝 NEW AGENT SETUP</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleRegister}>
        <input className="spy-input" name="username" placeholder="CODENAME (USERNAME)" onChange={handleChange} required />
        <input className="spy-input" name="email" type="email" placeholder="EMAIL" onChange={handleChange} required />
        <input className="spy-input" name="password" type="password" placeholder="PASSWORD" onChange={handleChange} required />

        <div style={{ margin: '20px 0', border: '1px dashed #333', padding: '15px', borderRadius: '10px' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#0088ff' }}></p>
          <input className="spy-input" name="safePin" placeholder="SAFE PIN (e.g. 1234)" onChange={handleChange} required />
          <input className="spy-input" name="panicPin" placeholder="PANIC PIN (e.g. 9999)" onChange={handleChange} required />
          <input className="spy-input" name="adminPin" placeholder="ADMIN PIN (e.g. 5555)" onChange={handleChange} required />
        </div>

        <button type="submit" className="spy-btn btn-secondary">
          INITIALIZE PROFILE
        </button>
      </form>

      <p className="link-text" onClick={() => navigate('/login')}>
        ALREADY AN AGENT? LOGIN
      </p>
    </div>
  );
};

export default Register;