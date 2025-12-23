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

  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  const userId = userInfo ? userInfo._id : 'unknown';
  const watchLink = `${window.location.origin}/watch/${userId}`;

  useEffect(() => {
    if (location.state && location.state.autoSOS) {
      handlePanic('SENTINEL_AI_TRIGGER');
      window.history.replaceState({}, document.title);
    }
    // eslint-disable-next-line
  }, [location]);

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
        batteryListener = () =>
          battery.removeEventListener('levelchange', checkLevel);
      }
    };
    monitorBattery();
    return () => batteryListener && batteryListener();
    // eslint-disable-next-line
  }, []);

  const recordAudio = () => {
    return new Promise((resolve) => {
      if (!navigator.mediaDevices) { resolve(null); return; }
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const audioChunks = [];
          mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
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

  const handlePanic = async (alertType = 'PANIC_BUTTON') => {
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
        if (audioBlob) formData.append('audio', audioBlob, 'evidence.webm');

        await axios.post(
          'https://ghost-backend-fq2h.onrender.com/api/alerts',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        setStatus('✅ ALERT SENT! STARTING CAMERA...');
        setTimeout(() => navigate('/stream'), 1500);
      } catch {
        setStatus('❌ SERVER ERROR');
        setLoading(false);
      }
    };

    setStatus('🛰️ ACQUIRING GPS SATELLITES...');

    if (!navigator.geolocation) {
      sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Not Supported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => sendToCloud({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: 'GPS Lock Acquired'
      }),
      () => sendToCloud({ latitude: 0, longitude: 0, address: 'GPS Failed' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>SAFE ZONE</h2>
          <p style={styles.protocol}>
            GHOST PROTOCOL: <span style={{ color: '#32d74b' }}>ACTIVE</span>
          </p>
          <div style={styles.battery}>🔋 {batteryLevel}% BATTERY</div>
        </div>

        <div style={styles.panicWrap}>
          <button
            style={styles.panicBtn}
            onClick={() => handlePanic('PANIC_BUTTON')}
            disabled={loading}
          >
            {loading ? '...' : 'SOS'}
          </button>
        </div>

        <div style={styles.statusBar}>STATUS: {status}</div>

        <div style={styles.menu}>
          <button style={styles.menuBtn} onClick={() => navigate('/fake-call')}>📱 FAKE CALL</button>
          <button style={{ ...styles.menuBtn, background: '#003300' }} onClick={() => navigate('/stream')}>👁️ GHOST EYE</button>
          <button style={{ ...styles.menuBtn, background: '#4a0000' }} onClick={() => navigate('/sentinel')}>🤖 SENTINEL AI</button>
          <button style={{ ...styles.menuBtn, background: '#222' }} onClick={() => navigate('/settings')}>⚙️ SETTINGS</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '14px',
    fontFamily: 'system-ui',
    color: '#fff'
  },

  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#111',
    borderRadius: '20px',
    padding: '18px',
    boxShadow: '0 0 25px rgba(0,0,0,0.6)'
  },

  header: {
    textAlign: 'center',
    marginBottom: '12px'
  },

  title: {
    margin: 0,
    letterSpacing: '1px'
  },

  protocol: {
    fontSize: '12px',
    opacity: 0.8
  },

  battery: {
    fontSize: '12px',
    opacity: 0.6
  },

  panicWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: '18px 0'
  },

  panicBtn: {
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: '#ff2d2d',
    color: '#fff',
    fontSize: '34px',
    fontWeight: '800',
    border: 'none',
    boxShadow: '0 0 30px rgba(255,45,45,0.6)',
    cursor: 'pointer'
  },

  statusBar: {
    textAlign: 'center',
    fontSize: '12px',
    padding: '8px',
    background: '#000',
    borderRadius: '10px',
    marginBottom: '12px'
  },

  menu: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },

  menuBtn: {
    padding: '12px',
    borderRadius: '12px',
    border: 'none',
    background: '#1a1a1a',
    color: '#fff',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Dashboard;
