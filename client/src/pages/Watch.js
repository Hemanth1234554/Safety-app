// File: client/src/pages/Watch.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const Watch = () => {
    const { id } = useParams();
    const videoRef = useRef();
    const [status, setStatus] = useState("SEARCHING FOR SIGNAL...");
    const [showPlayBtn, setShowPlayBtn] = useState(false);
    
    useEffect(() => {
        const socket = io('https://ghost-backend-fq2h.onrender.com');
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }] });

        socket.on('connect', () => {
            socket.emit("join_room", id);
            setStatus("CONNECTED. WAITING FOR VIDEO...");
        });

        // Handle Stream
        pc.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                videoRef.current.muted = true; // Auto-mute to allow play
                videoRef.current.play()
                    .then(() => setStatus("🔴 LIVE FEED"))
                    .catch(() => setShowPlayBtn(true)); // Show button if blocked
            }
        };

        // Signaling
        socket.on("offer", async (offer) => {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { answer, roomId: id });
        });

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("ice_candidate", { candidate: e.candidate, roomId: id });
        };
        socket.on("ice_candidate", (c) => pc.addIceCandidate(new RTCIceCandidate(c)).catch(()=>{}));

        return () => { socket.disconnect(); pc.close(); };
    }, [id]);

    const handlePlay = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play();
            setShowPlayBtn(false);
            setStatus("🟢 LIVE AUDIO & VIDEO");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>GHOST EYE: MONITOR</div>
            <div style={styles.subHeader}>ID: {id}</div>

            <div style={styles.videoBox}>
                <video ref={videoRef} autoPlay playsInline muted style={styles.video} controls />
            </div>

            <div style={styles.status}>{status}</div>

            {showPlayBtn && (
                <button onClick={handlePlay} style={styles.playBtn}>
                    🔊 TAP TO UNMUTE & PLAY
                </button>
            )}
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#000', color: '#00ff00', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Courier New, monospace' },
    header: { fontSize: '24px', fontWeight: 'bold', color: '#0088ff', textShadow: '0 0 10px #0088ff' },
    subHeader: { fontSize: '10px', color: '#555', marginBottom: '20px' },
    videoBox: { width: '100%', maxWidth: '600px', border: '1px solid #333', borderRadius: '5px', padding: '5px', background: '#111' },
    video: { width: '100%', borderRadius: '5px', display: 'block' },
    status: { marginTop: '15px', fontSize: '12px', color: '#fff' },
    playBtn: { marginTop: '20px', padding: '15px 30px', background: '#0088ff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }
};

export default Watch;