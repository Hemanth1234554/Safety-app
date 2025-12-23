// File: server/index.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// 1. IMPORT YOUR ROUTES
import alertRoutes from './routes/alertRoutes.js'; 
import authRoutes from './routes/authRoutes.js'; // <--- NEW: Import Auth
import userRoutes from './routes/userRoutes.js'; // <--- NEW: Import Users/Contacts

dotenv.config();

const app = express();

app.use(cors({
    origin: "*", 
    methods: ["GET", "POST", "PUT", "DELETE"], // Added PUT/DELETE just in case
    credentials: true
}));
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Error:", err));

// 2. USE YOUR ROUTES
app.use('/api/alerts', alertRoutes);
app.use('/api/auth', authRoutes);   // <--- NEW: Enable Login/Register
app.use('/api/users', userRoutes);  // <--- NEW: Enable Contacts

app.get('/', (req, res) => res.send('Ghost Eye Server is Running 👁️'));

// SETUP SOCKET SERVER
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log(`🔌 User Connected: ${socket.id}`);

    socket.on("join_room", (roomId) => {
        socket.join(roomId);
        console.log(`🏠 User ${socket.id} joined room: ${roomId}`);
        socket.to(roomId).emit("user_joined", socket.id);
    });

    socket.on("offer", (data) => {
        socket.to(data.roomId).emit("offer", data.offer);
    });

    socket.on("answer", (data) => {
        socket.to(data.roomId).emit("answer", data.answer);
    });

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