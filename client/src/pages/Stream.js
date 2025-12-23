// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const userVideo = useRef();
    const socketRef = useRef();
    const streamRef = useRef();
    const [status, setStatus] = useState("⚠️ INITIALIZING...");
    const [logs, setLogs] = useState([]); // Start empty
    const navigate = useNavigate();

    // Safer Log Function
    const addLog = (msg) => {
        console.log(msg);
        setLogs(prev => [`${new Date().toLocaleTimeString().split(' ')[0]} ${msg}`, ...prev].slice(0, 10));
    };

    // 1. SAFE USER ID RETRIEVAL
    let userId = "anonymous";
    try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo && userInfo._id) userId = userInfo._id;
    } catch (e) {
        console.error("User Parse Error");
    }

    useEffect(() => {
        // Run immediately on mount
        const init = async () => {
            addLog(`🚀 APP STARTED. ID: ${userId}`);

            // 2. CONNECT SOCKET
            try {
                addLog("🔌 Connecting to Server...");
                const socket = io('https://ghost-backend-fq2h.onrender.com');
                socketRef.current = socket;

                socket.on('connect', () => {
                    setStatus("✅ SERVER CONNECTED");
                    addLog(`✅ Connected! Socket ID: ${socket.id}`);
                    addLog(`🏠 Joining Room: ${userId}`);
                    socket.emit("join_room", userId);
                });

                socket.on("user_joined", (viewerId) => {
                    setStatus("🔴 VIEWER JOINED - STARTING STREAM");
                    addLog(`👤 Viewer Detected: ${viewerId}`);
                    startCall(socket, userId);
                });

                socket.on("answer", () => addLog("🤝 Answer Received"));
                
            } catch (err) {
                setStatus("❌ SOCKET ERROR");
                addLog(`Socket Failed: ${err.message}`);
            }

            // 3. START CAMERA
            try {
                addLog("📷 Requesting Camera...");
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { width: 300, height: 300 }, // Low res for speed
                    audio: true 
                });
                
                addLog("✅ Camera Active");
                streamRef.current = stream;
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
            } catch (err) {
                setStatus("❌ CAMERA DENIED");
                addLog(`Camera Failed: ${err.message}`);
                alert("Please Allow Camera Permissions!");
            }
        };

        init();

        return () => {
            if(socketRef.current) socketRef.current.disconnect();
        };
        // eslint-disable-next-line
    }, []);

    const startCall = async (socket, roomId) => {
        addLog("🚀 Starting P2P Handshake...");
        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
            });

            const stream = streamRef.current;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            pc.onicecandidate = (e) => {
                if (e.candidate) socket.emit("ice_candidate", { candidate: e.candidate, roomId });
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            
            addLog("📤 Sending Offer...");
            socket.emit("offer", { offer, roomId });

            socket.on("answer", (ans) => pc.setRemoteDescription(new RTCSessionDescription(ans)));
            socket.on("ice_candidate", (can) => pc.addIceCandidate(new RTCIceCandidate(can)));

        } catch (err) {
            addLog(`❌ P2P Error: ${err.message}`);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>BROADCASTER DEBUG</div>
            <div style={{color: '#ffff00', fontSize: '12px', marginBottom: '5px'}}>
                MY ID: {userId}
            </div>
            
            <div style={styles.logBox}>
                {logs.length === 0 ? "Waiting for logs..." : logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            
            <video ref={userVideo} autoPlay playsInline muted style={styles.video} />

            <div style={styles.status}>{status}</div>

            <button onClick={() => navigate('/dashboard')} style={styles.stopBtn}>
                STOP
            </button>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#220000', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', fontFamily: 'monospace' },
    header: { fontSize: '18px', fontWeight: 'bold', color: 'red', marginBottom: '5px' },
    logBox: { width: '100%', height: '150px', background: '#000', color: '#00ff00', fontSize: '11px', padding: '5px', overflowY: 'scroll', border: '1px solid #555', marginBottom: '10px' },
    video: { width: '200px', height: '200px', background: '#000', border: '2px solid red', objectFit: 'cover' },
    status: { fontSize: '14px', marginTop: '10px', fontWeight: 'bold' },
    stopBtn: { marginTop: '20px', padding: '10px 30px', background: 'red', color: 'white', border: 'none', borderRadius: '5px' }
};

export default Stream;