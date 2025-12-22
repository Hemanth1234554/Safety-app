import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const FakeCall = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('standby');
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio(
      'https://www.orangefreesounds.com/wp-content/uploads/2020/09/Iphone-12-ringtone.mp3'
    );
    audioRef.current.loop = true;

    if (step === 'standby') {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      const timer = setTimeout(() => setStep('incoming'), 5000);
      return () => clearTimeout(timer);
    }

    if (step === 'incoming') {
      audioRef.current.play().catch(() => {});
      if (navigator.vibrate) {
        navigator.vibrate([500, 1000, 500, 1000]);
      }
    }

    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (navigator.vibrate) navigator.vibrate(0);
    };
  }, [step]);

  const answerCall = () => {
    if (audioRef.current) audioRef.current.pause();
    if (navigator.vibrate) navigator.vibrate(0);
    setStep('active');
  };

  const endCall = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    navigate('/dashboard');
  };

  if (step === 'standby') {
    return <div style={{ width: '100vw', height: '100vh', background: 'black' }} />;
  }

  return (
    <div style={styles.screen}>
      <div style={styles.phone}>
        {/* TOP */}
        <div style={styles.top}>
          {step === 'incoming' && <div style={styles.incoming}>Incoming Call</div>}
          <div style={styles.name}>HOME</div>
          <div style={styles.sub}>Mobile</div>
          {step === 'active' && <div style={styles.timer}>00:01</div>}
        </div>

        {/* MIDDLE */}
        {step === 'active' && (
          <div style={styles.controls}>
            <div style={styles.control}>🎤<span>Mute</span></div>
            <div style={styles.control}>📅<span>Keypad</span></div>
            <div style={styles.control}>🔊<span>Speaker</span></div>
          </div>
        )}

        {/* BOTTOM */}
        <div style={styles.bottom}>
          {step === 'incoming' && (
            <>
              <button onClick={endCall} style={{ ...styles.btn, background: '#ff3b30' }}>✕</button>
              <button
                onClick={answerCall}
                style={{ ...styles.btn, background: '#30d158', animation: 'pulse 1.5s infinite' }}
              >
                📞
              </button>
            </>
          )}

          {step === 'active' && (
            <button onClick={endCall} style={{ ...styles.btn, background: '#ff3b30' }}>📞</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(48,209,88,.7); }
          70% { box-shadow: 0 0 0 25px rgba(48,209,88,0); }
          100% { box-shadow: 0 0 0 0 rgba(48,209,88,0); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  screen: {
    width: '100vw',
    height: '100vh',
    background: 'black',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  phone: {
    width: 'min(100vw, 390px)',
    height: 'min(100vh, 780px)',
    background: 'linear-gradient(180deg, #2c5364, #0f2027)',
    borderRadius: '30px',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont'
  },

  top: {
    textAlign: 'center',
    marginTop: '40px'
  },

  incoming: {
    fontSize: '14px',
    opacity: 0.7,
    marginBottom: '10px'
  },

  name: {
    fontSize: '36px',
    fontWeight: '600'
  },

  sub: {
    fontSize: '16px',
    opacity: 0.6
  },

  timer: {
    marginTop: '8px',
    fontSize: '22px'
  },

  controls: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '40px'
  },

  control: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '22px',
    gap: '6px'
  },

  bottom: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '40px'
  },

  btn: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    border: 'none',
    color: 'white',
    fontSize: '26px',
    cursor: 'pointer'
  }
};

export default FakeCall;
