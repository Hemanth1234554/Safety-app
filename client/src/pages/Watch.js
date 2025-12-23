// File: client/src/pages/Watch.js
import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams } from 'react-router-dom';

const Watch = () => {
    const { id } = useParams();
    const videoRef = useRef();
    const [logs, setLogs] = useState(["Waiting for connection..."]);
    const peerConnection = useRef(new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
    }));

    const addLog = (msg) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 8));
        console.log(msg);
    };

    useEffect(() => {
        const socket = io('https://ghost-backend-fq2h.onrender.com');

        socket.on('connect', () => {
            addLog(`✅ Server Connected`);
            addLog(`🏠 Joining Room: ${id}`);
            socket.emit("join_room", id);
        });

        // 1. Wait for Offer
        socket.on("offer", async (offer) => {
            addLog("📩 Offer Received! Processing...");
            try {
                await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peerConnection.current.createAnswer();
                await peerConnection.current.setLocalDescription(answer);
                
                addLog("📤 Sending Answer...");
                socket.emit("answer", { answer, roomId: id });
            } catch (err) {
                addLog(`❌ OFFER ERROR: ${err.message}`);
            }
        });

        // 2. Handle Video Stream
        peerConnection.current.ontrack = (event) => {
            addLog(`📺 Track Received: ${event.streams[0].id}`);
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                videoRef.current.muted = true; // FORCE MUTE
                
                const playPromise = videoRef.current.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => addLog("🟢 Playing (Muted)"))
                        .catch(e => addLog(`⚠️ Autoplay Blocked: ${e.message}`));
                }
            }
        };

        // 3. Monitor Connection Health
        peerConnection.current.oniceconnectionstatechange = () => {
            addLog(`📡 ICE State: ${peerConnection.current.iceConnectionState}`);
        };

        // 4. ICE Candidates
        peerConnection.current.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice_candidate", { candidate: event.candidate, roomId: id });
            }
        };
        socket.on("ice_candidate", (candidate) => {
            peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => {});
        });

        return () => {
            socket.disconnect();
            peerConnection.current.close();
        };
        // eslint-disable-next-line
    }, [id]);

    const handleUnmute = () => {
        if (videoRef.current) {
            videoRef.current.muted = false;
            videoRef.current.play();
            addLog("🔊 Unmuted Manually");
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>MONITOR DEBUG</div>
            
            {/* BLUE LOG BOX */}
            <div style={styles.logBox}>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            <video ref={videoRef} autoPlay playsInline muted style={styles.video} controls />
            
            <button onClick={handleUnmute} style={styles.forceBtn}>
                🔊 TAP TO UNMUTE
            </button>
        </div>
    );
};

const styles = {
    page: { height: '100vh', background: '#000', color: '#0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px', fontFamily: 'monospace' },
    header: { fontSize: '18px', fontWeight: 'bold', color: '#0088ff', marginBottom: '10px' },
    logBox: { width: '100%', height: '150px', background: '#111', color: '#00ffff', fontSize: '11px', padding: '5px', overflowY: 'scroll', border: '1px solid #0088ff', marginBottom: '15px' },
    video: { width: '100%', maxWidth: '400px', height: '300px', background: '#222', border: '1px solid #555' },
    forceBtn: { marginTop: '20px', padding: '15px 30px', background: '#0088ff', color: 'white', border: 'none', borderRadius: '5px', fontSize: '16px', fontWeight: 'bold' }
};

export default Watch;