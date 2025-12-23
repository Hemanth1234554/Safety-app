// File: client/src/pages/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

const Dashboard = () => {
  const [status, setStatus] = useState('SYSTEM STANDBY');
  const [loading, setLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const alertSentRef = useRef(false);

  const navigate = useNavigate();
  const location = useLocation();

  // 1. GENERATE THE WATCH LINK
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo._id : 'unknown';
  // This creates a link like: https://safety-app.vercel.app/watch/12345
  const watchLink = `${window.location.origin}/watch/${userId}`;

  // --- SENTINEL AI TRIGGER LISTENER ---
  useEffect(() => {
    if (location.state && location.state.autoSOS) {
      handlePanic('SENTINEL_AI_TRIGGER');
      // Clear the state so it doesn't loop
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

  // --- AUDIO RECORDER HELPER ---
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
            stream.getTracks().forEach(track => track.stop()); // Stop mic
            resolve(blob);
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 5000); // Record for 5 seconds
        })
        .catch(() => resolve(null));
    });
  };

  // --- THE MAIN SOS FUNCTION ---
  const handlePanic = async (alertType = 'PANIC_BUTTON') => {
    setStatus('INITIALIZING EMERGENCY SEQUENCE...');
    setLoading(true);

    // 1. Record Audio (5s)
    let audioBlob = null;
    if (alertType === 'PANIC_BUTTON' || alertType === 'SENTINEL_AI_TRIGGER') {
      setStatus('🎙️ RECORDING EVIDENCE (5s)...');
      audioBlob = await recordAudio();
    }

    // 2. Define Send Function
    const sendToCloud = async (locData) => {
      try {
        setStatus('☁️ TRANSMITTING DATA...');

        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('type', alertType);
        formData.append('latitude', locData.latitude);
        formData.append('longitude', locData.longitude);
        formData.append('address', locData.address || '');

        // ** CRITICAL: SEND THE VIDEO LINK **
        formData.append('videoLink', watchLink);

        if (audioBlob) {
          formData.append('audio', audioBlob, 'evidence.webm');
        }

        // Send to Backend
        await axios.post('https://ghost-backend-fq2h.onrender.com/api/alerts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        setStatus('✅ ALERT SENT! STARTING CAMERA...');

        // 3. AUTO-REDIRECT TO VIDEO STREAM
        setTimeout(() => {
          navigate('/stream');
        }, 1500);

      } catch (error) {
        console.error(error);
        setStatus('❌ SERVER ERROR (Check Internet)');
        setLoading(false);
      }
    };

    // 3. Get GPS
    setStatus('🛰️ ACQUIRING GPS SATELLITES...');

    if (!navigator.geolocation) {
      sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Not Supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success! We got real coordinates
        sendToCloud({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'GPS Lock Acquired'
        });
      },
      (error) => {
        // Retry or Fail
        console.warn("GPS High Accuracy Failed, trying low power...", error.message);
        // Fallback: Try low accuracy if high fails
        navigator.geolocation.getCurrentPosition(
          (pos) => sendToCloud({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: 'Low Accuracy GPS' }),
          () => sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Signal Failed' })
        );
      },
      // TIMEOUT: Wait up to 15 seconds for a lock (instead of giving up instantly)
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div className="dashboard-container">
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
        <button className="spy-btn danger" onClick={() => navigate('/settings')}><span>⚙️</span> SETTINGS</button>
      </div>
    </div>
  );
};

export default Dashboard;