// File: server/controllers/alertController.js
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { sendEmergencyNotifications } from '../utils/notificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to get directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createAlert = async (req, res) => {
    try {
        // 1. EXTRACT videoLink HERE
        const { userId, type, location, audioData, videoLink } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let audioUrl = null;

        // --- AUDIO SAVING LOGIC ---
        if (audioData) {
            const base64Data = audioData.replace(/^data:audio\/webm;base64,/, "");
            
            const evidenceDir = path.join(__dirname, '../evidence');
            if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true });
            }

            const fileName = `evidence-${userId}-${Date.now()}.webm`;
            const filePath = path.join(evidenceDir, fileName);

            fs.writeFileSync(filePath, base64Data, 'base64');
            
            audioUrl = `/evidence/${fileName}`;
            console.log(`🎙️ AUDIO EVIDENCE SAVED: ${fileName}`);
        }

        // Create the Alert in DB
        // (If your Schema doesn't have videoLink yet, it simply won't save to DB, 
        // but we still pass it to the email below)
        const newAlert = new Alert({
            user: userId,
            type,
            location,
            audioUrl
        });

        await newAlert.save();

        // 2. PASS videoLink TO EMAIL SERVICE
        // We explicitly add videoLink to the data object
        sendEmergencyNotifications(user, { 
            ...newAlert.toObject(), 
            audioUrl, 
            videoLink 
        }).catch(err => 
            console.error("Background Email Error:", err)
        );

        res.status(201).json(newAlert);

    } catch (error) {
        console.error("Alert Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};