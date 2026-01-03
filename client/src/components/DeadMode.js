// File: client/src/components/DeadMode.js
import React, { useEffect, useState } from 'react';

const DeadMode = ({ active, onExit }) => {
    const [taps, setTaps] = useState(0);

    // 1. ENTER FULL SCREEN (IMMERSIVE MODE)
    useEffect(() => {
        if (active) {
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch((err) => console.log("Fullscreen blocked:", err));
            }
        } else {
            if (document.exitFullscreen) {
                // document.exitFullscreen().catch((err) => console.log("Exit Fullscreen blocked", err));
            }
        }
    }, [active]);

    // 2. SECRET UNLOCK LOGIC (Triple Tap Top-Left)
    const handleSecretTap = () => {
        if (taps + 1 >= 3) {
            // Success! Unlock
            setTaps(0);
            onExit(); 
            // Exit fullscreen
            if (document.exitFullscreen) document.exitFullscreen();
        } else {
            setTaps(taps + 1);
            // Reset taps if user is too slow (security)
            setTimeout(() => setTaps(0), 1000); 
        }
    };

    if (!active) return null;

    return (
        <div style={styles.blackScreen}>
            {/* The Hidden Unlock Button (Invisible, Top Left) */}
            <div 
                onClick={handleSecretTap} 
                style={styles.secretButton}
            ></div>
            
            {/* This layer consumes all other clicks so nothing happens */}
        </div>
    );
};

const styles = {
    blackScreen: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000000',
        zIndex: 99999, // Must be on top of everything
        cursor: 'none', // Hide mouse cursor
    },
    secretButton: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100px', // Hit box size
        height: '100px',
        zIndex: 100000,
        // background: 'rgba(255,0,0,0.2)' // Uncomment to see the button for testing
    }
};

export default DeadMode;