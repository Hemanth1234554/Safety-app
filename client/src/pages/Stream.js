// File: client/src/pages/Stream.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useNavigate } from 'react-router-dom';

const Stream = () => {
    const userVideo = useRef();
    const socketRef = useRef(); // Use Ref for socket to close it easily
    const streamRef = useRef(); // Use Ref for stream to stop tracks
    const [status, setStatus] = useState("INITIALIZING EMERGENCY BROADCAST...");
    const navigate = useNavigate();

    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    const userId = userInfo ? userInfo._id : "anonymous";

    useEffect(() => {
        // 1. Connect Immediately
        const socket = io('https://ghost-backend-fq2h.onrender.com');
        socketRef.current = socket;

        // 2. Start Camera Immediately
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((stream) => {
                streamRef.current = stream;
                if (userVideo.current) {
                    userVideo.current.srcObject = stream;
                }
                
                // 3. Auto-Join Room
                socket.emit("join_room", userId);
                setStatus("🔴 LIVE - WAITING FOR FAMILY TO CONNECT...");

                // 4. Setup Signaling
                socket.on("user_joined", (viewerId) => {
                    setStatus("⚠️ CONTACT CONNECTED! STREAMING DATA...");
                    startCall(socket, viewerId, stream);
                });
            })
            .catch((err) => {
                console.error(err);
                setStatus("❌ CAMERA ERROR: " + err.message);
            });

        // Cleanup on unmount (Back button or Stop)
        return () => {
            stopStreaming();
        };
        // eslint-disable-next-line
    }, []);

    const startCall = async (socket, viewerId, stream) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice_candidate", { candidate: event.candidate, roomId: userId });
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit("offer", { offer, roomId: userId });

        socket.on("answer", (answer) => {
            peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        });

        socket.on("ice_candidate", (candidate) => {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        });
    };

    // --- THE KILL SWITCH ---
    const stopStreaming = () => {
        // 1. Stop Camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        // 2. Disconnect Socket (Kills the link for the viewer)
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
    };

    const handleStopAndExit = () => {
        stopStreaming();
        navigate('/dashboard');
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>🚨 EMERGENCY MODE 🚨</div>
            <div style={styles.status}>{status}</div>
            
            <video ref={userVideo} autoPlay playsInline muted style={styles.video} />

            <div style={styles.controls}>
                <p style={{color: '#fff', fontSize: '12px'}}>
                    Link sent to contacts. Stay on this page to stream.
                </p>
                <button onClick={handleStopAndExit} style={styles.stopBtn}>
                    ⏹️ STOP STREAMING
                </button>
            </div>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#220000', color: '#ff4444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
    header: { fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', color: 'red', animation: 'blink 1s infinite' },
    status: { fontSize: '14px', color: '#fff', marginBottom: '10px' },
    video: { width: '100%', maxWidth: '600px', borderRadius: '8px', border: '3px solid red', backgroundColor: '#000', height: '400px', objectFit: 'cover' },
    controls: { marginTop: '20px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'center' },
    stopBtn: { padding: '20px', fontSize: '20px', background: 'red', color: 'white', border: '3px solid white', borderRadius: '50px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }
};

export default Stream;