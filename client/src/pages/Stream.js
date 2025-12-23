// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const userVideo = useRef();
    const socketRef = useRef();
    const streamRef = useRef();
    const [status, setStatus] = useState("INITIALIZING ENCRYPTED UPLINK...");
    const [viewerConnected, setViewerConnected] = useState(false);
    const navigate = useNavigate();

    let userId = "anonymous";
    try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo && userInfo._id) userId = userInfo._id;
    } catch (e) {}

    useEffect(() => {
        const socket = io('https://ghost-backend-fq2h.onrender.com');
        socketRef.current = socket;

        const init = async () => {
            // 1. Start Camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                streamRef.current = stream;
                if (userVideo.current) userVideo.current.srcObject = stream;
                
                // 2. Connect to Room
                socket.on('connect', () => {
                    socket.emit("join_room", userId);
                    setStatus("🔴 LIVE - WAITING FOR VIEWERS");
                });
            } catch (err) {
                setStatus("❌ CAMERA ERROR: " + err.message);
            }
        };

        init();

        // 3. Handle Connections
        socket.on("user_joined", (viewerId) => {
            setViewerConnected(true);
            setStatus("⚠️ FAMILY MEMBER CONNECTED - STREAMING");
            startCall(socket, userId);
        });

        return () => {
            if(socketRef.current) socketRef.current.disconnect();
            if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
        // eslint-disable-next-line
    }, []);

    const startCall = async (socket, roomId) => {
        const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }] });
        const stream = streamRef.current;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("ice_candidate", { candidate: e.candidate, roomId });
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { offer, roomId });

        socket.on("answer", (ans) => pc.setRemoteDescription(new RTCSessionDescription(ans)));
        socket.on("ice_candidate", (can) => pc.addIceCandidate(new RTCIceCandidate(can)));
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <span style={styles.blink}>●</span> GHOST PROTOCOL ACTIVE
            </div>
            
            <div style={styles.videoWrapper}>
                <video ref={userVideo} autoPlay playsInline muted style={styles.video} />
                {viewerConnected && <div style={styles.overlay}>👁️ SECURE CONNECTION ESTABLISHED</div>}
            </div>

            <div style={styles.status}>{status}</div>

            <button onClick={() => navigate('/dashboard')} style={styles.stopBtn}>
                ⏹️ STOP STREAM & EXIT
            </button>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#110000', color: '#ff4444', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial, sans-serif' },
    header: { fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '20px', color: '#ff0000' },
    blink: { animation: 'blink 1s infinite' },
    videoWrapper: { position: 'relative', width: '100%', maxWidth: '500px', borderRadius: '10px', overflow: 'hidden', border: '2px solid #ff0000', boxShadow: '0 0 20px #550000' },
    video: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    overlay: { position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#00ff00', padding: '5px 10px', fontSize: '12px', borderRadius: '5px' },
    status: { marginTop: '20px', fontSize: '14px', color: '#ffaaaa' },
    stopBtn: { marginTop: '30px', padding: '15px 40px', background: '#d32f2f', color: 'white', border: 'none', borderRadius: '50px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 5px 15px rgba(200,0,0,0.4)' }
};

export default Stream;