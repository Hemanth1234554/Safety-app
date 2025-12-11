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

// --- THE FIX: ALLOW ALL ORIGINS (CORS) ---
// This tells the server: "Don't block the mobile app."
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase limits for Audio files
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/evidence', express.static(path.join(__dirname, '/evidence')));

const server = http.createServer(app);

// --- THE FIX: ALLOW SOCKETS FROM ANYWHERE ---
const io = new Server(server, {
    cors: {
        origin: "*", // Allow mobile app to connect
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => {
    res.send('GHOST PROTOCOL: Backend System Operational (Cloud)');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/user', userRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`SERVER RUNNING ON PORT ${PORT}`);
});