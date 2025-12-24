// File: client/src/pages/Sentinel.js
import React, { useEffect, useState, useRef } from 'react';
import * as tf from "@tensorflow/tfjs"; 
import * as speechCommands from "@tensorflow-models/speech-commands";
import { useNavigate } from 'react-router-dom';

const Sentinel = () => {
  const navigate = useNavigate();
  const [model, setModel] = useState(null);
  const [action, setAction] = useState(null);
  const [labels, setLabels] = useState([]);
  const [listening, setListening] = useState(false);
  const recognizerRef = useRef(null);
  
  // NEW: Store location here
  const locationRef = useRef({ latitude: 0, longitude: 0 });

  useEffect(() => {
    const loadModel = async () => {
      try { await tf.setBackend('webgl'); } catch { await tf.setBackend('cpu'); }
      await tf.ready();
      const recognizer = speechCommands.create("BROWSER_FFT");
      await recognizer.ensureModelLoaded();
      setModel(recognizer);
      setLabels(recognizer.wordLabels());
      recognizerRef.current = recognizer;
    };
    loadModel();
    return () => recognizerRef.current?.stopListening();
  }, []);

  // NEW: Get GPS immediately when user clicks "Start"
  const startListening = () => {
    if (!model) return;
    setListening(true);

    // 1. PRE-FETCH GPS (User Gesture allows this)
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (pos) => {
                locationRef.current = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                console.log("Sentinel GPS Locked:", locationRef.current);
            },
            (err) => console.log("Sentinel GPS Error:", err),
            { enableHighAccuracy: true }
        );
    }

    // 2. Start AI Listener
    model.listen(result => {
      const { scores } = result;
      const max = Math.max(...scores);
      const idx = scores.indexOf(max);
      const word = labels[idx];

      if (max > 0.5) setAction(word);
      if (word === "stop" && max > 0.85) triggerPanic();
    }, {
      probabilityThreshold: 0.75,
      invokeCallbackOnNoiseAndUnknown: true,
      overlapFactor: 0.5
    });
  };

  const stopListening = () => {
    setListening(false);
    model?.stopListening();
  };

  const triggerPanic = () => {
    stopListening();
    // 3. PASS THE GPS DATA TO DASHBOARD
    navigate('/dashboard', { 
        state: { 
            autoSOS: true,
            preLocation: locationRef.current // Passing the baton
        } 
    });
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <header style={styles.header}>
          <h1 style={styles.title}>Sentinel AI</h1>
          <span style={{ ...styles.badge, background: model ? '#e6f4ea' : '#fff4e5', color: model ? '#137333' : '#b26a00' }}>
            {model ? 'Online' : 'Loading...'}
          </span>
        </header>

        <div style={styles.statusBox}>
          <div style={styles.statusLabel}>Status</div>
          <div style={{ ...styles.statusValue, color: listening ? '#137333' : '#b00020' }}>
            {listening ? '👂 Listening...' : 'Standby'}
          </div>
        </div>

        <div style={styles.heardBox}>
          <div style={styles.heardLabel}>Last detected word</div>
          <div style={styles.heardWord}>{action ? action.toUpperCase() : '—'}</div>
        </div>

        {!listening ? (
          <button onClick={startListening} disabled={!model} style={{ ...styles.primaryBtn, opacity: model ? 1 : 0.5 }}>
            Start Listening
          </button>
        ) : (
          <button onClick={stopListening} style={styles.dangerBtn}>Stop Listening</button>
        )}

        <p style={styles.helper}>Say <b>“STOP”</b> loudly to trigger SOS</p>
        <button onClick={() => navigate('/dashboard')} style={styles.linkBtn}>Back to Dashboard</button>
      </div>
    </div>
  );
};

const styles = {
  page: { minHeight: '100vh', background: '#0e0f12', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' },
  card: { width: '100%', maxWidth: '520px', background: '#16181d', borderRadius: '16px', padding: '28px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', color: '#eaeaea' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  title: { fontSize: '26px', fontWeight: '600', margin: 0 },
  badge: { padding: '6px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '500' },
  statusBox: { marginBottom: '20px' },
  statusLabel: { fontSize: '12px', color: '#9aa0a6' },
  statusValue: { fontSize: '18px', fontWeight: '600' },
  heardBox: { background: '#0f1115', borderRadius: '12px', padding: '16px', marginBottom: '24px' },
  heardLabel: { fontSize: '12px', color: '#9aa0a6' },
  heardWord: { fontSize: '24px', marginTop: '6px', fontWeight: '600', color: '#fff' },
  primaryBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', background: '#1a73e8', color: '#fff', cursor: 'pointer' },
  dangerBtn: { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '16px', fontWeight: '600', background: '#d93025', color: '#fff', cursor: 'pointer' },
  helper: { marginTop: '12px', fontSize: '13px', color: '#9aa0a6', textAlign: 'center' },
  linkBtn: { marginTop: '18px', background: 'none', border: 'none', color: '#8ab4f8', cursor: 'pointer', fontSize: '14px', width: '100%' }
};

export default Sentinel;