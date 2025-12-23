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
        batteryListener = () => battery.removeEventListener('levelchange', checkLevel);
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
            stream.getTracks().forEach(t => t.stop());
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
    if (alertType !== 'BATTERY_CRITICAL') {
      setStatus('🎙️ RECORDING EVIDENCE...');
      audioBlob = await recordAudio();
    }

    const sendToCloud = async (loc) => {
      try {
        setStatus('☁️ SENDING ALERT...');
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('type', alertType);
        formData.append('latitude', loc.latitude);
        formData.append('longitude', loc.longitude);
        formData.append('address', loc.address || '');
        formData.append('videoLink', watchLink);
        if (audioBlob) formData.append('audio', audioBlob);

        await axios.post('https://ghost-backend-fq2h.onrender.com/api/alerts', formData);
        setStatus('✅ ALERT SENT');
        setTimeout(() => navigate('/stream'), 1200);
      } catch {
        setStatus('❌ NETWORK ERROR');
        setLoading(false);
      }
    };

    navigator.geolocation.getCurrentPosition(
      pos => sendToCloud({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        address: 'GPS OK'
      }),
      () => sendToCloud({ latitude: 0, longitude: 0, address: 'GPS FAILED' }),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  return (
    <div style={styles.page}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h1 style={styles.title}>SAFE ZONE</h1>
          <div style={styles.meta}>
            <span>GHOST PROTOCOL: <b style={{ color: '#32d74b' }}>ACTIVE</b></span>
            <span>🔋 {batteryLevel}%</span>
          </div>
        </div>

        <div style={styles.sosWrap}>
          <button style={styles.sosBtn} onClick={() => handlePanic()} disabled={loading}>
            {loading ? '...' : 'SOS'}
          </button>
        </div>

        <div style={styles.status}>STATUS: {status}</div>

        <div style={styles.grid}>
          <button style={styles.card} onClick={() => navigate('/fake-call')}>📱 Fake Call</button>
          <button style={styles.card} onClick={() => navigate('/stream')}>👁️ Ghost Eye</button>
          <button style={styles.card} onClick={() => navigate('/sentinel')}>🤖 Sentinel AI</button>
          <button style={styles.card} onClick={() => navigate('/settings')}>⚙️ Settings</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    background: 'radial-gradient(circle at top, #111, #000)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    color: '#fff',
    fontFamily: 'system-ui'
  },

  panel: {
    width: '100%',
    maxWidth: '720px',
    background: '#0f0f0f',
    borderRadius: '24px',
    padding: '24px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.8)'
  },

  header: { textAlign: 'center', marginBottom: '20px' },
  title: { margin: 0, letterSpacing: '2px' },

  meta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    opacity: 0.8,
    marginTop: '6px'
  },

  sosWrap: {
    display: 'flex',
    justifyContent: 'center',
    margin: '30px 0'
  },

  sosBtn: {
    width: '220px',
    height: '220px',
    borderRadius: '50%',
    background: '#ff2d2d',
    border: 'none',
    color: '#fff',
    fontSize: '40px',
    fontWeight: '900',
    boxShadow: '0 0 60px rgba(255,45,45,0.7)',
    cursor: 'pointer'
  },

  status: {
    textAlign: 'center',
    fontSize: '13px',
    padding: '10px',
    background: '#000',
    borderRadius: '12px',
    marginBottom: '24px'
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px'
  },

  card: {
    padding: '18px',
    borderRadius: '16px',
    background: '#1a1a1a',
    border: 'none',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer'
  }
};

export default Dashboard;
