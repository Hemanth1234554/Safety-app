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
    const peerConnection = useRef(new RTCPeerConnection(servers)); // Use Ref to keep connection stable

    useEffect(() => {
        const socket = io('https://ghost-backend-fq2h.onrender.com');

        // 1. HANDLE INCOMING STREAM (The Critical Part)
        peerConnection.current.ontrack = (event) => {
            console.log("📺 TRACK RECEIVED:", event.streams[0]);
            setStatus("🔴 SIGNAL RECEIVED - ATTEMPTING PLAY");
            
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                // Mute it first (Browsers allow muted autoplay)
                videoRef.current.muted = true; 
                
                // Force play
                videoRef.current.play()
                    .then(() => setStatus("🟢 LIVE FEED ACTIVE"))
                    .catch(e => {
                        console.error("Autoplay blocked:", e);
                        setStatus("⚠️ TAP BUTTON BELOW TO START VIDEO");
                    });
            }
        };

        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice_candidate", { candidate: event.candidate, roomId: id });
            }
        };

        socket.on('connect', () => {
            socket.emit("join_room", id);
        });

        socket.on("offer", async (offer) => {
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            socket.emit("answer", { answer, roomId: id });
        });

        socket.on("ice_candidate", (candidate) => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
        });

        return () => {
            socket.disconnect();
            peerConnection.current.close();
        };
    }, [id]);

    const handleForcePlay = () => {
        if(videoRef.current) {
            videoRef.current.muted = false; // Unmute on click
            videoRef.current.play();
            setStatus("🟢 LIVE FEED ACTIVE");
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>GHOST EYE: MONITOR</div>
            <div style={styles.status}>{status}</div>

            <div style={styles.videoBox}>
                {/* Added 'muted' attribute directly to HTML */}
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
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
    status: { fontSize: '12px', color: '#fff', marginBottom: '20px', border: '1px solid #333', padding: '5px' },
    videoBox: { padding: '5px', border: '1px solid #333', borderRadius: '5px', background: '#111', width: '90%', maxWidth: '600px' },
    video: { width: '100%', borderRadius: '5px', background: '#000', minHeight: '200px' },
    forceBtn: { marginTop: '20px', padding: '15px 30px', background: '#0088ff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold' }
};

export default Watch;