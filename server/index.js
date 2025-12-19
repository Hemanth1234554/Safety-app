// File: server/index.js
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import userRoutes from './routes/userRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Config
dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Static Files (Evidence)
app.use('/evidence', express.static(path.join(__dirname, 'evidence')));

const server = http.createServer(app);

// --- GHOST EYE PROTOCOL: WEBRTC SIGNALING ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// File: server/index.js (Update the socket section)

io.on("connection", (socket) => {
    // 1. Join Room
    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`🔌 User joined room: ${roomId}`);
        
        // NEW: Tell everyone in the room a new person arrived
        socket.to(roomId).emit("user_connected", socket.id);
    });

    // 2. Offer (Broadcaster -> Viewer)
    socket.on("offer", (data) => {
        socket.to(data.roomId).emit("offer", data.offer);
    });

    // 3. Answer (Viewer -> Broadcaster)
    socket.on("answer", (data) => {
        socket.to(data.roomId).emit("answer", data.answer);
    });

    // 4. ICE Candidates
    socket.on("ice_candidate", (data) => {
        socket.to(data.roomId).emit("ice_candidate", data.candidate);
    });
});

app.get('/', (req, res) => { res.send('GHOST PROTOCOL: Backend System Operational'); });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => { console.log(`SERVER RUNNING ON PORT ${PORT}`); });