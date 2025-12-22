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
    const remoteVideoRef = useRef();
    const peerConnection = useRef();
    const socket = useRef();
    const [status, setStatus] = useState("SEARCHING FOR SIGNAL...");
    const [streamReady, setStreamReady] = useState(false); // NEW


    useEffect(() => {
        socket.current = io('https://ghost-backend-fq2h.onrender.com');
        socket.current.emit("join_room", id);

        // 1. Listen for Offer
        socket.current.on("offer", async (offer) => {
            console.log("RECEIVED OFFER");
            setStatus("SIGNAL DETECTED - NEGOTIATING...");

            if (peerConnection.current) peerConnection.current.close();
            peerConnection.current = new RTCPeerConnection(servers);

            // 2. Handle Incoming Stream (The Video)
            peerConnection.current.ontrack = (event) => {
                console.log("🎥 STREAM RECEIVED!", event.streams[0]);
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = event.streams[0];
                    setStreamReady(true); // Enable the Play Button
                    setStatus("🔴 LIVE FEED READY - CLICK PLAY");
                }
            };

            // 3. Handle ICE Candidates
            peerConnection.current.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.current.emit("ice_candidate", {
                        candidate: event.candidate,
                        roomId: id
                    });
                }
            };

            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            socket.current.emit("answer", { answer, roomId: id });
        });

        // 4. Listen for ICE Candidates
        socket.current.on("ice_candidate", (candidate) => {
            if (peerConnection.current) {
                peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

        return () => {
            if (socket.current) socket.current.disconnect();
            if (peerConnection.current) peerConnection.current.close();
        };
    }, [id]);

    // NEW: Manual Play Function
    const handlePlay = () => {
        if (remoteVideoRef.current) {
            remoteVideoRef.current.play()
                .then(() => setStatus("🔴 WATCHING LIVE"))
                .catch(e => console.error("Play Error:", e));
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>GHOST EYE: MONITOR</div>
            <div style={styles.status}>TARGET ID: {id}</div>
            <div style={styles.status}>{status}</div>

            <video
                ref={remoteVideoRef}
                playsInline
                controls
                style={styles.video}
            />

            {/* NEW: Only show this button when video is actually there */}
            {streamReady && (
                <button onClick={handlePlay} style={styles.playBtn}>
                    ▶️ FORCE PLAY VIDEO
                </button>
            )}
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#111', color: '#0088ff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
    header: { fontSize: '20px', fontWeight: 'bold', marginBottom: '10px', letterSpacing: '2px' },
    status: { fontSize: '12px', color: '#888', marginBottom: '5px' },
    video: { width: '100%', maxWidth: '600px', borderRadius: '4px', border: '1px solid #333', marginTop: '20px', backgroundColor: '#000', minHeight: '200px' },
    playBtn: { marginTop: '20px', padding: '15px 40px', fontSize: '18px', background: '#0088ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }
};

export default Watch;