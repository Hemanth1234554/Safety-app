// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const userVideo = useRef();
    const socketRef = useRef();
    const streamRef = useRef();
    const [logs, setLogs] = useState(["Waiting for SOS sequence..."]);
    const navigate = useNavigate();

    // Helper to print logs on screen
    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
        console.log(msg);
    };

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userId = userInfo ? userInfo._id : "anonymous";

    useEffect(() => {
        // 1. Connect to Server
        const socket = io('https://ghost-backend-fq2h.onrender.com');
        socketRef.current = socket;

        socket.on('connect', () => {
            addLog(`✅ Server Connected (Socket ID: ${socket.id})`);
            addLog(`🏠 Joining Room: ${userId}`);
            socket.emit("join_room", userId);
        });

        // 2. Start Camera
        addLog("📷 Requesting Camera...");
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                addLog("✅ Camera Access Granted");
                addLog(`tracks: ${stream.getTracks().length}`);
                streamRef.current = stream;
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
            })
            .catch((err) => addLog(`❌ CAMERA FAIL: ${err.message}`));

        // 3. Listen for the Viewer (Person clicking email link)
        socket.on("user_joined", (viewerId) => {
            addLog(`👤 VIEWER JOINED! ID: ${viewerId}`);
            addLog("🚀 Starting Handshake...");
            startCall(socket, userId);
        });

        socket.on("answer", () => addLog("🤝 Answer Received - Connecting..."));
        socket.on("ice_candidate", () => {}); // Silent log for candidates

        return () => {
            if(streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            socket.disconnect();
        };
        // eslint-disable-next-line
    }, []);

    const startCall = async (socket, roomId) => {
        try {
            const peerConnection = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
            });

            // Add Video/Audio Tracks to Connection
            const stream = streamRef.current;
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream);
                addLog(`📤 Added Track: ${track.kind}`);
            });

            peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit("ice_candidate", { candidate: event.candidate, roomId });
                }
            };

            peerConnection.oniceconnectionstatechange = () => {
                addLog(`📡 Connection State: ${peerConnection.iceConnectionState}`);
            };

            // Create Offer
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            addLog("📨 Sending Offer to Viewer...");
            socket.emit("offer", { offer, roomId });

            socket.on("answer", (answer) => {
                peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
            });

            socket.on("ice_candidate", (candidate) => {
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            });

        } catch (err) {
            addLog(`❌ ERROR: ${err.message}`);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>BROADCASTER DEBUG (SOS MODE)</div>
            
            {/* THE BLUE LOG BOX */}
            <div style={styles.logBox}>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
            
            <video ref={userVideo} autoPlay playsInline muted style={styles.video} />

            <button onClick={() => navigate('/dashboard')} style={styles.stopBtn}>
                ⏹️ STOP STREAMING
            </button>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#220000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', fontFamily: 'monospace' },
    header: { fontSize: '16px', fontWeight: 'bold', color: 'red', marginBottom: '10px' },
    logBox: { width: '100%', height: '150px', background: '#000', color: '#00ffff', fontSize: '11px', padding: '5px', overflowY: 'scroll', border: '1px solid #00ffff', marginBottom: '15px' },
    video: { width: '100%', maxWidth: '400px', height: '300px', background: '#000', border: '2px solid red', objectFit: 'cover' },
    stopBtn: { marginTop: '20px', padding: '15px 30px', background: 'red', color: 'white', border: '3px solid white', borderRadius: '50px', fontWeight: 'bold' }
};

export default Stream;