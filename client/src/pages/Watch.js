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
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun1.l.google.com:19302' }]
        });

        socket.on('connect', () => {
            socket.emit("join_room", id);
            setStatus("CONNECTED. WAITING FOR VIDEO...");
        });

        pc.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
                videoRef.current.muted = true;
                videoRef.current.play()
                    .then(() => setStatus("🔴 LIVE FEED"))
                    .catch(() => setShowPlayBtn(true));
            }
        };

        socket.on("offer", async (offer) => {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { answer, roomId: id });
        });

        pc.onicecandidate = (e) => {
            if (e.candidate) socket.emit("ice_candidate", { candidate: e.candidate, roomId: id });
        };

        socket.on("ice_candidate", (c) =>
            pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {})
        );

        return () => {
            socket.disconnect();
            pc.close();
        };
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
            <div style={styles.container}>
                <div style={styles.header}>LIVE MONITOR</div>
                <div style={styles.subHeader}>STREAM ID: {id}</div>

                <div style={styles.videoWrapper}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        controls
                        style={styles.video}
                    />
                </div>

                <div style={styles.status}>{status}</div>

                {showPlayBtn && (
                    <button onClick={handlePlay} style={styles.playBtn}>
                        🔊 TAP TO UNMUTE
                    </button>
                )}
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: '#fff',
        fontFamily: 'system-ui'
    },

    container: {
        width: '100%',
        maxWidth: '900px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
    },

    header: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#00aaff'
    },

    subHeader: {
        fontSize: '11px',
        opacity: 0.6
    },

    videoWrapper: {
        width: '100%',
        maxWidth: '720px',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '2px solid #00aaff'
    },

    video: {
        width: '100%',
        height: 'auto',
        display: 'block',
        background: '#000'
    },

    status: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#00ff88',
        marginTop: '4px'
    },

    playBtn: {
        marginTop: '14px',
        padding: '14px 28px',
        background: '#00aaff',
        color: '#fff',
        border: 'none',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '700',
        cursor: 'pointer',
        width: '100%',
        maxWidth: '320px'
    }
};

export default Watch;
