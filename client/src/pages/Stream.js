// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const navigate = useNavigate();

    const localVideoRef = useRef();
    const peerConnection = useRef();
    const socket = useRef();
    const [status, setStatus] = useState("INITIALIZING...");

    const servers = {
        iceServers: [
            { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
        ]
    };

    useEffect(() => {
        if (!user) { navigate('/login'); return; }

        if (!socket.current) {
            socket.current = io('https://ghost-backend-fq2h.onrender.com');
        }

        // 1. Setup Camera
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
                setStatus("CAMERA READY. OPEN VIEWER LINK, THEN CLICK 'CONNECT'.");
                socket.current.emit("join_room", user._id);
            })
            .catch(err => {
                console.error("Camera Error:", err);
                setStatus("CAMERA BLOCKED");
            });

        // 2. Receive Answer (From Viewer)
        socket.current.on("answer", async (answer) => {
            if (!peerConnection.current) return;

            const state = peerConnection.current.signalingState;
            console.log("Received Answer. Current State:", state);

            if (state === "have-local-offer") {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
                setStatus("🔴 LIVE STREAMING SUCCESSFUL");
            }
        });

        // 3. ICE Candidates
        socket.current.on("ice_candidate", (candidate) => {
            if (peerConnection.current && peerConnection.current.remoteDescription) {
                peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            if (socket.current) socket.current.disconnect();
            if (peerConnection.current) peerConnection.current.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- MANUAL TRIGGER FUNCTION ---
    const startConnection = async () => {
        setStatus("SENDING SIGNAL...");
        console.log("Manual Start Initiated");

        // Create Peer Connection
        if (peerConnection.current) peerConnection.current.close();
        peerConnection.current = new RTCPeerConnection(servers);

        // Add Tracks
        const stream = localVideoRef.current.srcObject;
        stream.getTracks().forEach(track => peerConnection.current.addTrack(track, stream));

        // Handle ICE Candidates
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.current.emit("ice_candidate", {
                    candidate: event.candidate,
                    roomId: user._id
                });
            }
        };

        // Create and Send Offer
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        socket.current.emit("offer", { offer, roomId: user._id });
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>GHOST EYE: BROADCAST</div>
            <div style={styles.status}>{status}</div>

            <video ref={localVideoRef} autoPlay playsInline muted style={styles.video} />

            {/* NEW MANUAL BUTTON */}
            <button onClick={startConnection} style={styles.connectBtn}>
                📶 CONNECT TO VIEWER
            </button>

            <button onClick={() => navigate('/dashboard')} style={styles.btn}>STOP STREAM</button>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#000', color: '#0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
    header: { fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' },
    status: { fontSize: '12px', color: '#fff', marginBottom: '10px', textAlign: 'center' },
    video: { width: '100%', maxWidth: '400px', borderRadius: '10px', border: '2px solid #0f0', transform: 'scaleX(-1)' },
    connectBtn: { marginTop: '15px', padding: '15px 30px', background: '#004400', color: '#0f0', border: '2px solid #0f0', borderRadius: '5px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' },
    btn: { marginTop: '10px', padding: '10px 20px', background: 'red', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }
};

export default Stream;