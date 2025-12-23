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
    const { id } = useParams(); // This is the UserID we are watching
    const videoRef = useRef();
    const [status, setStatus] = useState("CONNECTING TO SERVER...");
    const socketRef = useRef();

    useEffect(() => {
        // 1. Connect to Server
        const socket = io('https://ghost-backend-fq2h.onrender.com');
        socketRef.current = socket;

        socket.on('connect', () => {
            setStatus("✅ SERVER CONNECTED. JOINING ROOM...");
            // Emit join event immediately upon connection
            socket.emit("join_room", id); 
        });

        // 2. Setup WebRTC
        const peerConnection = new RTCPeerConnection(servers);

        peerConnection.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                setStatus("🔴 LIVE STREAM RECEIVED");
            }
        };

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice_candidate", { candidate: event.candidate, roomId: id });
            }
        };

        // 3. Listen for Signals
        socket.on("offer", async (offer) => {
            setStatus("⚠️ CALL RECEIVED! ANSWERING...");
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            socket.emit("answer", { answer, roomId: id });
        });

        socket.on("ice_candidate", (candidate) => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });

        // Force a "Join" retry after 2 seconds just in case server was asleep
        setTimeout(() => {
            if (socket.connected) socket.emit("join_room", id);
        }, 2000);

        return () => socket.disconnect();
    }, [id]);

    // Force Play is needed for browsers that block auto-video
    const handleForcePlay = () => {
        if(videoRef.current) {
            videoRef.current.play();
            setStatus("PLAYING...");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>GHOST EYE: MONITOR</div>
            <div style={styles.subHeader}>TARGET ID: {id}</div>
            <div style={styles.status}>{status}</div>

            <div style={styles.videoBox}>
                <video ref={videoRef} autoPlay playsInline controls style={styles.video} />
            </div>

            <button onClick={handleForcePlay} style={styles.forceBtn}>
                ▶️ CLICK IF VIDEO IS STUCK
            </button>
        </div>
    );
};

const styles = {
    container: { height: '100vh', background: '#000', color: '#00ff00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#0088ff', letterSpacing: '2px' },
    subHeader: { fontSize: '12px', color: '#666', marginBottom: '20px' },
    status: { fontSize: '14px', color: '#fff', marginBottom: '20px', border: '1px solid #333', padding: '5px 10px' },
    videoBox: { padding: '10px', border: '1px solid #333', borderRadius: '10px', background: '#111' },
    video: { width: '100%', maxWidth: '600px', borderRadius: '5px', maxHeight: '400px' },
    forceBtn: { marginTop: '20px', padding: '10px 20px', background: '#333', color: '#fff', border: '1px solid #fff', cursor: 'pointer' }
};

export default Watch;