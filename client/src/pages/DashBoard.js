// File: client/src/pages/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import FallDetector from '../components/FallDetector.js'; // Ensure path is correct
import DeadMode from '../components/DeadMode.js';         // <--- NEW IMPORT

const Dashboard = () => {
  const [status, setStatus] = useState('SYSTEM STANDBY');
  const [loading, setLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const [isDeadMode, setIsDeadMode] = useState(false); // <--- NEW STATE
  const alertSentRef = useRef(false);
  
  const navigate = useNavigate();
  const location = useLocation();

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo._id : 'unknown';
  const watchLink = `${window.location.origin}/watch/${userId}`;

  // --- SENTINEL AI TRIGGER LISTENER ---
  useEffect(() => {
    if (location.state && location.state.autoSOS) {
      handlePanic('SENTINEL_AI_TRIGGER', location.state.preLocation);
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location]);

  // --- BATTERY MONITOR ---
  useEffect(() => {
    let batteryListener;
    const monitorBattery = async () => {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        const checkLevel = () => {
          const level = Math.floor(battery.level * 100);
          setBatteryLevel(level);
          if (level <= 5 && !alertSentRef.current) {
            alertSentRef.current = true;
            handlePanic('BATTERY_CRITICAL');
          }
        };
        checkLevel();
        battery.addEventListener('levelchange', checkLevel);
        batteryListener = () => battery.removeEventListener('levelchange', checkLevel);
      }
    };
    monitorBattery();
    return () => { if (batteryListener) batteryListener(); }
    // eslint-disable-next-line
  }, []);

  const recordAudio = () => {
    return new Promise((resolve) => {
      if (!navigator.mediaDevices) { resolve(null); return; }
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const audioChunks = [];
          mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(track => track.stop());
            resolve(blob);
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 5000);
        })
        .catch(() => resolve(null));
    });
  };

  const handlePanic = async (alertType = 'PANIC_BUTTON', preLocation = null) => {
    setStatus('INITIALIZING EMERGENCY SEQUENCE...');
    setLoading(true);

    let audioBlob = null;
    if (alertType === 'PANIC_BUTTON' || alertType === 'SENTINEL_AI_TRIGGER') {
      setStatus('🎙️ RECORDING EVIDENCE (5s)...');
      audioBlob = await recordAudio();
    }

    const sendToCloud = async (locData) => {
      try {
        setStatus('☁️ TRANSMITTING DATA...');
        
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('type', alertType);
        formData.append('latitude', locData.latitude);
        formData.append('longitude', locData.longitude);
        formData.append('address', locData.address || '');
        formData.append('videoLink', watchLink); 

        if (audioBlob) {
            formData.append('audio', audioBlob, 'evidence.webm');
        }

        await axios.post('https://ghost-backend-fq2h.onrender.com/api/alerts', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        setStatus('✅ ALERT SENT! STARTING CAMERA...');
        setTimeout(() => {
            navigate('/stream');
        }, 1500);

      } catch (error) {
        console.error(error);
        setStatus('❌ SERVER ERROR (Check Internet)');
        setLoading(false);
      }
    };

    if (preLocation && preLocation.latitude !== 0) {
        console.log("Using Pre-Fetched GPS:", preLocation);
        sendToCloud({
            latitude: preLocation.latitude,
            longitude: preLocation.longitude,
            address: 'AI Auto-Lock'
        });
        return;
    }

    setStatus('🛰️ ACQUIRING GPS...');
    if (!navigator.geolocation) {
      sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Not Supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        sendToCloud({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'GPS Lock Acquired'
        });
      },
      (error) => {
        console.warn("GPS Failed:", error.message);
        sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Signal Failed' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="dashboard-container">
      {/* SENSORS & MODES */}
      <FallDetector onTrigger={() => handlePanic('CRASH_DETECTED')} />
      <DeadMode active={isDeadMode} onExit={() => setIsDeadMode(false)} />

      <div className="header-section">
        <h2>Safe Zone</h2>
        <p>GHOST PROTOCOL: <span style={{ color: '#32d74b' }}>ACTIVE</span></p>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>🔋 {batteryLevel}% BATTERY</div>
      </div>

      <div className="panic-container">
        <button className="panic-btn" onClick={() => handlePanic('PANIC_BUTTON')} disabled={loading}>
          {loading ? '...' : 'SOS'}
        </button>
      </div>

      <div className="status-bar">STATUS: {status}</div>

      <div className="tactical-menu">
        <button className="spy-btn" onClick={() => navigate('/fake-call')}><span>📱</span> FAKE CALL</button>
        <button className="spy-btn" onClick={() => navigate('/stream')} style={{ background: '#004400' }}>👁️ GHOST EYE (MANUAL)</button>
        <button className="spy-btn" onClick={() => navigate('/sentinel')} style={{ background: '#4a0000' }}>🤖 SENTINEL AI</button>
        
        {/* NEW DEAD MODE BUTTON */}
        <button className="spy-btn" onClick={() => setIsDeadMode(true)} style={{ background: '#000', border: '1px solid #333' }}>
            🪦 DEAD MODE
        </button>
        
        <button className="spy-btn danger" onClick={() => navigate('/settings')}><span>⚙️</span> SETTINGS</button>
      </div>
    </div>
  );
};

export default Dashboard;