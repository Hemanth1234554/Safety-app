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

dotenv.config();
connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/evidence', express.static(path.join(__dirname, 'evidence')));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// --- LOUD DEBUGGING LOGIC ---
io.on("connection", (socket) => {
    console.log(`⚡ NEW CONNECTION: ${socket.id}`);

    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`🚪 User ${socket.id} JOINED ROOM: ${roomId}`);
    });

    socket.on("offer", (data) => {
        console.log(`📤 OFFER received from ${socket.id} for ROOM ${data.roomId}`);
        // Log if anyone else is in the room
        const room = io.sockets.adapter.rooms.get(data.roomId);
        console.log(`👥 People in room ${data.roomId}: ${room ? room.size : 0}`);
        
        socket.to(data.roomId).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
        console.log(`📥 ANSWER received from ${socket.id} for ROOM ${data.roomId}`);
        socket.to(data.roomId).emit("answer", data.answer);
    });

    socket.on("ice_candidate", (data) => {
        console.log(`❄️ ICE Candidate from ${socket.id}`); 
        socket.to(data.roomId).emit("ice_candidate", data.candidate);
    });

    socket.on("disconnect", () => {
        console.log(`❌ DISCONNECTED: ${socket.id}`);
    });
});

app.get('/', (req, res) => { res.send('GHOST PROTOCOL: Backend Online'); });

app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 10000;
server.listen(PORT, () => { console.log(`SERVER RUNNING ON PORT ${PORT}`); });