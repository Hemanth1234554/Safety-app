// File: client/src/App.js
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import Dashboard from './pages/DashBoard.js';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import FakeCall from './pages/FakeCall.js';
import Stream from './pages/Stream.js';
import Watch from './pages/Watch.js';
import Sentinel from './pages/Sentinel';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/welcome');
    }
  }, [navigate]);

  const handlePress = async (value) => {
    if (value === 'C') {
      setDisplay('0');
      return;
    }

    if (value === '=') {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));

      // 1. SAFE PIN -> DASHBOARD
      if (userInfo && display === userInfo.safePin) {
        navigate('/dashboard');
        return;
      }

      // 2. ADMIN PIN -> SETTINGS (NEW FEATURE)
      if (userInfo && display === userInfo.adminPin) {
        navigate('/settings');
        return;
      }

      // 3. PANIC PIN -> SILENT ALERT
      if (userInfo && display === userInfo.panicPin) {
        setDisplay('Error');
        try {
          navigator.geolocation.getCurrentPosition(async (position) => {
            await axios.post('https://ghost-backend-fq2h.onrender.com/api/alerts', {
              userId: userInfo._id,
              type: 'PANIC_BUTTON_SILENT',
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: 'Silent Panic Triggered'
              }
            });
          });
        } catch (err) { }
        return;
      }

      // 4. LOGOUT CODE
      if (display === '0000') {
        localStorage.removeItem('userInfo');
        navigate('/welcome');
        return;
      }

      try {
        // eslint-disable-next-line no-eval
        setDisplay(String(eval(display)));
      } catch {
        setDisplay('Error');
      }
      return;
    }

    setDisplay(display === '0' && value !== '0' ? value : display + value);
  };

  return (
    <div className="calculator-container">
      <div className="display">{display}</div>
      <div className="keypad">
        {/* Same buttons as before */}
        <button className="btn-gray" onClick={() => handlePress('C')}>AC</button>
        <button className="btn-gray" onClick={() => handlePress('+/-')}>+/-</button>
        <button className="btn-gray" onClick={() => handlePress('%')}>%</button>
        <button className="btn-orange" onClick={() => handlePress('/')}>÷</button>

        <button className="btn-dark" onClick={() => handlePress('7')}>7</button>
        <button className="btn-dark" onClick={() => handlePress('8')}>8</button>
        <button className="btn-dark" onClick={() => handlePress('9')}>9</button>
        <button className="btn-orange" onClick={() => handlePress('*')}>×</button>

        <button className="btn-dark" onClick={() => handlePress('4')}>4</button>
        <button className="btn-dark" onClick={() => handlePress('5')}>5</button>
        <button className="btn-dark" onClick={() => handlePress('6')}>6</button>
        <button className="btn-orange" onClick={() => handlePress('-')}>-</button>

        <button className="btn-dark" onClick={() => handlePress('1')}>1</button>
        <button className="btn-dark" onClick={() => handlePress('2')}>2</button>
        <button className="btn-dark" onClick={() => handlePress('3')}>3</button>
        <button className="btn-orange" onClick={() => handlePress('+')}>+</button>

        <button className="btn-dark btn-zero" onClick={() => handlePress('0')}>0</button>
        <button className="btn-dark" onClick={() => handlePress('.')}>.</button>
        <button className="btn-orange" onClick={() => handlePress('=')}>=</button>
      </div>
    </div>
  );
};

function App() {
  return (
    <Routes>
      <Route path="/fake-call" element={<FakeCall />} />
      <Route path="/" element={<Calculator />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/stream" element={<Stream />} />
      <Route path="/watch/:id" element={<Watch />} />
      <Route path="/sentinel" element={<Sentinel />} />
    </Routes>
  );
}

export default App;