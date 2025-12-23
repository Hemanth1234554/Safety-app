// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const userVideo = useRef();
    const socketRef = useRef();
    const streamRef = useRef();
    const [status, setStatus] = useState("⚠️ INITIALIZING...");
    const [logs, setLogs] = useState([]);
    const navigate = useNavigate();

    const addLog = (msg) => {
        console.log(msg);
        setLogs(prev => [`${new Date().toLocaleTimeString().split(' ')[0]} ${msg}`, ...prev].slice(0, 10));
    };

    let userId = "anonymous";
    try {
        const userInfo = JSON.parse(localStorage.getItem("userInfo"));
        if (userInfo && userInfo._id) userId = userInfo._id;
    } catch (e) {}

    useEffect(() => {
        const init = async () => {
            addLog(`🚀 APP STARTED. ID: ${userId}`);

            try {
                addLog("🔌 Connecting to Server...");
                const socket = io('https://ghost-backend-fq2h.onrender.com');
                socketRef.current = socket;

                socket.on('connect', () => {
                    setStatus("✅ SERVER CONNECTED");
                    addLog(`✅ Connected! Socket ID: ${socket.id}`);
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

            try {
                addLog("📷 Requesting Camera...");
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 640 },
                    audio: true
                });
                streamRef.current = stream;
                if (userVideo.current) userVideo.current.srcObject = stream;
                addLog("✅ Camera Active");
            } catch (err) {
                setStatus("❌ CAMERA DENIED");
                alert("Allow camera permissions");
            }
        };

        init();
        return () => socketRef.current && socketRef.current.disconnect();
        // eslint-disable-next-line
    }, []);

    const startCall = async (socket, roomId) => {
        addLog("🚀 Starting P2P Handshake...");
        try {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
            });

            streamRef.current.getTracks().forEach(track =>
                pc.addTrack(track, streamRef.current)
            );

            pc.onicecandidate = e => {
                if (e.candidate) socket.emit("ice_candidate", { candidate: e.candidate, roomId });
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { offer, roomId });
            addLog("📤 Offer Sent");

            socket.on("answer", ans =>
                pc.setRemoteDescription(new RTCSessionDescription(ans))
            );
            socket.on("ice_candidate", can =>
                pc.addIceCandidate(new RTCIceCandidate(can))
            );
        } catch (err) {
            addLog(`❌ P2P Error: ${err.message}`);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.left}>
                    <div style={styles.header}>LIVE BROADCAST</div>
                    <div style={styles.sub}>ID: {userId}</div>

                    <video
                        ref={userVideo}
                        autoPlay
                        playsInline
                        muted
                        style={styles.video}
                    />

                    <div style={styles.status}>{status}</div>

                    <button onClick={() => navigate('/dashboard')} style={styles.stopBtn}>
                        STOP STREAM
                    </button>
                </div>

                <div style={styles.right}>
                    <div style={styles.logHeader}>SYSTEM LOGS</div>
                    <div style={styles.logBox}>
                        {logs.length === 0
                            ? <div style={{ opacity: 0.5 }}>Waiting for events...</div>
                            : logs.map((l, i) => <div key={i}>{l}</div>)
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0b0b0b',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontFamily: 'system-ui'
    },

    container: {
        width: '100%',
        maxWidth: '1100px',
        display: 'flex',
        gap: '20px',
        padding: '15px',
        flexWrap: 'wrap'
    },

    left: {
        flex: 1,
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },

    right: {
        flex: 1,
        minWidth: '280px',
        background: '#111',
        borderRadius: '12px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column'
    },

    header: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#ff2d2d'
    },

    sub: {
        fontSize: '12px',
        opacity: 0.7
    },

    video: {
        width: '100%',
        maxWidth: '420px',
        aspectRatio: '1 / 1',
        borderRadius: '16px',
        background: '#000',
        border: '2px solid #ff2d2d',
        objectFit: 'cover'
    },

    status: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#00ff88'
    },

    stopBtn: {
        padding: '12px',
        width: '100%',
        maxWidth: '300px',
        background: '#ff2d2d',
        color: '#fff',
        border: 'none',
        borderRadius: '10px',
        fontWeight: '700',
        cursor: 'pointer'
    },

    logHeader: {
        fontSize: '14px',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#00ff88'
    },

    logBox: {
        flex: 1,
        background: '#000',
        borderRadius: '10px',
        padding: '10px',
        fontSize: '12px',
        color: '#00ff00',
        overflowY: 'auto'
    }
};

export default Stream;
