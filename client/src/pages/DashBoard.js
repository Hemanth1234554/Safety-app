// File: client/src/pages/Dashboard.js
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [status, setStatus] = useState('SYSTEM STANDBY');
  const [loading, setLoading] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(100);
  const alertSentRef = useRef(false);
  const navigate = useNavigate();

  // --- BATTERY SENTINEL ---
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

  const triggerFakeCall = () => {
    // Go to the fake call page IMMEDIATELY (The delay happens there)
    navigate('/fake-call');
  };

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
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => resolve(reader.result);
            stream.getTracks().forEach(track => track.stop());
          };
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 5000);
        })
        .catch(() => resolve(null));
    });
  };

  // --- THE NEW "FAIL-SAFE" PANIC HANDLER ---
  const handlePanic = async (alertType = 'PANIC_BUTTON') => {
    setStatus('INITIALIZING...');
    setLoading(true);

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));

    // 1. Prepare Audio (Always try to record)
    let audioBase64 = null;
    if (alertType === 'PANIC_BUTTON') {
      setStatus('RECORDING EVIDENCE (5s)...');
      audioBase64 = await recordAudio();
    }

    // 2. Define the Send Function (Reusable)
    const sendToCloud = async (locData) => {
      try {
        setStatus('TRANSMITTING...');
        await axios.post('https://ghost-backend-fq2h.onrender.com/api/alerts', {
          userId: userInfo._id,
          type: alertType,
          location: locData,
          audioData: audioBase64
        });
        setStatus('✅ ALERT SENT SUCCESSFULLY');
      } catch (error) {
        console.error(error);
        setStatus('❌ SERVER ERROR (Check Internet)');
      }
      setLoading(false);
    };

    // 3. Try GPS with a Timeout
    setStatus('ACQUIRING GPS...');

    if (!navigator.geolocation) {
      // No GPS? Send anyway!
      sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Not Supported' });
      return;
    }

    const gpsOptions = { enableHighAccuracy: true, timeout: 10000 }; // 10s limit

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success!
        sendToCloud({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'GPS Lock Acquired'
        });
      },
      (error) => {
        // Failed? Send anyway!
        console.warn("GPS Failed:", error.message);
        setStatus('⚠️ GPS FAILED. SENDING WITHOUT LOC...');
        sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Signal Failed' });
      },
      gpsOptions
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
        <button className="spy-btn" onClick={triggerFakeCall}><span>📱</span> TRIGGER FAKE CALL (5s)</button>
        <button className="spy-btn danger" onClick={() => navigate('/settings')}><span>⚙️</span> SETTINGS & CONTACTS</button>
        <button className="spy-btn" onClick={() => navigate('/stream')} style={{ marginTop: '10px', background: '#004400' }}>
          👁️ GHOST EYE (LIVE)
        </button>
      </div>
    </div>
  );
};

export default Dashboard;