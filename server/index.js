// File: server/index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import alertRoutes from './routes/alertRoutes.js'; // Ensure path is correct

dotenv.config();

const app = express();

// 1. ALLOW VERCEL TO TALK TO SERVER (CORS)
app.use(cors({
    origin: "*", // Allow all connections (easiest for debugging)
    methods: ["GET", "POST"],
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// Routes
app.use('/api/alerts', alertRoutes);
app.get('/', (req, res) => res.send('Ghost Eye Server is Running 👁️'));

// 2. SETUP SOCKET SERVER
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // CRITICAL: Allow sockets from Vercel
        methods: ["GET", "POST"]
    }
});

// 3. THE SIGNALING LOGIC (The "Operator")
io.on("connection", (socket) => {
    console.log(`🔌 User Connected: ${socket.id}`);

    // Step A: Join the Room
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`🏠 User ${socket.id} joined room: ${roomId}`);
        
        // IMPORTANT: Tell everyone else in the room "I am here!"
        socket.to(roomId).emit("user_joined", socket.id);
    });

    // Step B: Relay the Offer (Broadcaster -> Viewer)
    socket.on("offer", (data) => {
        console.log("📨 Relaying Offer to Room:", data.roomId);
        socket.to(data.roomId).emit("offer", data.offer);
    });

    // Step C: Relay the Answer (Viewer -> Broadcaster)
    socket.on("answer", (data) => {
        console.log("🤝 Relaying Answer to Room:", data.roomId);
        socket.to(data.roomId).emit("answer", data.answer);
    });

    // Step D: Relay Internet Paths (ICE Candidates)
    socket.on("ice_candidate", (data) => {
        socket.to(data.roomId).emit("ice_candidate", data.candidate);
    });

    socket.on("disconnect", () => {
        console.log("❌ User Disconnected", socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});