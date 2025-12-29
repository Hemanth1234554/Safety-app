// File: client/src/components/FallDetector.js
import React, { useEffect, useState } from 'react';

const FallDetector = ({ onTrigger }) => {
    const [countdown, setCountdown] = useState(null); // Null = No Fall Detected
    const [listening, setListening] = useState(false);

    // THRESHOLD: How hard the impact must be (25 is a hard shake/drop)
    const IMPACT_THRESHOLD = 25; 

    useEffect(() => {
        // Check if sensor is available
        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion);
            setListening(true);
        } else {
            console.log("❌ Fall Detection not supported on this device.");
        }

        return () => {
            window.removeEventListener('devicemotion', handleMotion);
        };
        // eslint-disable-next-line
    }, []);

    // TIMER LOGIC: If countdown starts, tick down
    useEffect(() => {
        let timer;
        if (countdown !== null && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0) {
            // TIME'S UP! TRIGGER SOS!
            onTrigger(); 
            setCountdown(null); // Reset
        }
        return () => clearTimeout(timer);
    }, [countdown, onTrigger]);

    const handleMotion = (event) => {
        // 1. Get acceleration (including gravity)
        const { x, y, z } = event.accelerationIncludingGravity;

        if (!x || !y || !z) return;

        // 2. Calculate Total Force Vector (Pythagorean Theorem)
        const totalForce = Math.sqrt(x * x + y * y + z * z);

        // 3. Detect Impact
        // We check 'countdown === null' to ensure we don't trigger twice
        if (totalForce > IMPACT_THRESHOLD && countdown === null) {
            console.log("💥 IMPACT DETECTED! Force:", totalForce.toFixed(2));
            setCountdown(10); // Start 10s countdown
        }
    };

    // If no fall detected, render nothing (invisible mode)
    if (countdown === null) return null;

    // If fall detected, SHOW THE COUNTDOWN MODAL
    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <h1 style={styles.title}>💥 IMPACT DETECTED</h1>
                <p style={styles.text}>SOS sending in...</p>
                <div style={styles.timer}>{countdown}</div>
                <button onClick={() => setCountdown(null)} style={styles.cancelBtn}>
                    I AM OKAY (CANCEL)
                </button>
            </div>
        </div>
    );
};

const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 },
    modal: { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '80%' },
    title: { color: 'red', margin: 0, fontSize: '24px' },
    text: { fontSize: '18px', margin: '10px 0' },
    timer: { fontSize: '60px', fontWeight: 'bold', color: 'black' },
    cancelBtn: { padding: '15px 30px', background: 'green', color: 'white', border: 'none', borderRadius: '50px', fontSize: '18px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' }
};

export default FallDetector;