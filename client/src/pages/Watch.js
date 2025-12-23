// File: client/src/pages/Watch.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const servers = {
    iceServers: [
        { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
    ]
};

const Watch = () => {
    const { id } = useParams();
    const videoRef = useRef();
    const [status, setStatus] = useState("CONNECTING...");
    const [debugInfo, setDebugInfo] = useState(""); // To see technical errors
    const peerConnection = useRef(new RTCPeerConnection(servers));
    const socketRef = useRef();

    useEffect(() => {
        socketRef.current = io('https://ghost-backend-fq2h.onrender.com');

        // 1. SETUP VIDEO HANDLING
        peerConnection.current.ontrack = (event) => {
            console.log("📺 STREAM RECEIVED:", event.streams[0]);
            setStatus("🔴 SIGNAL RECEIVED");
            
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                // CRITICAL: Mute first to bypass browser security
                videoRef.current.muted = true; 
                
                // Force play promise
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => setStatus("🟢 LIVE FEED ACTIVE"))
                        .catch(error => {
                            console.error("Auto-play blocked:", error);
                            setStatus("⚠️ TAP BUTTON BELOW TO START");
                        });
                }
            }
        };

        // 2. MONITOR CONNECTION HEALTH
        peerConnection.current.oniceconnectionstatechange = () => {
            setDebugInfo(`ICE State: ${peerConnection.current.iceConnectionState}`);
            if (peerConnection.current.iceConnectionState === 'disconnected') {
                setStatus("❌ BROADCASTER DISCONNECTED");
            }
        };

        // 3. SIGNALING
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current.emit("ice_candidate", { candidate: event.candidate, roomId: id });
            }
        };

        socketRef.current.on('connect', () => {
            setDebugInfo("Socket Connected. Joining Room...");
            socketRef.current.emit("join_room", id);
        });

        socketRef.current.on("offer", async (offer) => {
            setStatus("⚠️ HANDSHAKE RECEIVED...");
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socketRef.current.emit("answer", { answer, roomId: id });
        });

        socketRef.current.on("ice_candidate", (candidate) => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            socketRef.current.disconnect();
            peerConnection.current.close();
        };
    }, [id]);

    const handleForcePlay = () => {
        if(videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play();
            setStatus("🟢 LIVE FEED ACTIVE");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>GHOST EYE: MONITOR</div>
            <div style={styles.status}>{status}</div>
            <div style={{fontSize: '10px', color: '#555', marginBottom: '10px'}}>{debugInfo}</div>

            <div style={styles.videoBox}>
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted // ALWAYS START MUTED
                    style={styles.video} 
                />
            </div>

            <button onClick={handleForcePlay} style={styles.forceBtn}>
                🔊 TAP TO UNMUTE & PLAY
            </button>
        </div>
    );
};

const styles = {
    container: { height: '100vh', background: '#000', color: '#00ff00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
    header: { fontSize: '20px', fontWeight: 'bold', color: '#0088ff', marginBottom: '10px' },
    status: { fontSize: '12px', color: '#fff', marginBottom: '5px', border: '1px solid #333', padding: '5px' },
    videoBox: { padding: '5px', border: '1px solid #333', borderRadius: '5px', background: '#111', width: '90%', maxWidth: '600px' },
    video: { width: '100%', borderRadius: '5px', background: '#000', minHeight: '200px', transform: 'scaleX(-1)' }, // Mirror effect
    forceBtn: { marginTop: '20px', padding: '15px 30px', background: '#0088ff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold' }
};

export default Watch;