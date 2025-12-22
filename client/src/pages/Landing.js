// File: client/src/pages/Landing.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      navigate('/'); 
    }
  }, [navigate]);

  return (
    <div className="auth-container">
      <div style={{ fontSize: '50px', marginBottom: '10px' }}>👻</div>
      <h1>GHOST PROTOCOL</h1>
      <p style={{ color: '#888', marginBottom: '40px' }}>SECURE ENCRYPTED NETWORK</p>
      
      <button 
        className="spy-btn btn-primary"
        onClick={() => navigate('/login')}
      >
        ACCESS SYSTEM
      </button>

      <button 
        className="spy-btn btn-secondary"
        onClick={() => navigate('/register')}
      >
        CREATE NEW IDENTITY
      </button>
      
      <p style={{ marginTop: '30px', fontSize: '10px', color: '#444' }}>
        v1.0.4 // UNCLASSIFIED
      </p>
    </div>
  );
};

export default Landing;