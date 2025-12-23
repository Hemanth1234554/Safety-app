// File: server/controllers/alertController.js
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { sendEmergencyNotifications } from '../utils/notificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createAlert = async (req, res) => {
    try {
        console.log("🚨 Received Alert Request");
        console.log("Body:", req.body);
        console.log("File:", req.file ? "Audio Attached" : "No Audio");

        // 1. EXTRACT DATA (Now handled by Multer)
        const { userId, type, latitude, longitude, address, videoLink } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let audioUrl = null;

        // 2. HANDLE AUDIO FILE (From req.file, NOT req.body)
        if (req.file) {
            const evidenceDir = path.join(__dirname, '../evidence');
            
            if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true });
            }

            const fileName = `evidence-${userId}-${Date.now()}.webm`;
            const filePath = path.join(evidenceDir, fileName);

            // Write the buffer directly to disk
            fs.writeFileSync(filePath, req.file.buffer);
            
            audioUrl = `/evidence/${fileName}`;
            console.log(`🎙️ AUDIO EVIDENCE SAVED: ${fileName}`);
        }

        // 3. Create Alert
        const newAlert = new Alert({
            user: userId,
            type,
            location: {
                latitude: latitude || 0,
                longitude: longitude || 0,
                address: address || ''
            },
            audioUrl
        });

        await newAlert.save();

        // 4. Send Email
        const emailPayload = { 
            ...newAlert.toObject(), 
            audioUrl, 
            videoLink 
        };

        sendEmergencyNotifications(user, emailPayload).catch(err => 
            console.error("Background Email Error:", err)
        );

        res.status(201).json(newAlert);

    } catch (error) {
        console.error("Alert Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};