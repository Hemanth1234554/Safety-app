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
        const { userId, type, location, audioData } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let audioUrl = null;

        // --- THE FIX: CREATE FOLDER IF MISSING ---
        if (audioData) {
            const base64Data = audioData.replace(/^data:audio\/webm;base64,/, "");
            
            // 1. Define the folder path
            const evidenceDir = path.join(__dirname, '../evidence');

            // 2. Check and Create Directory recursively
            if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true });
            }

            // 3. Define file path and Save
            const fileName = `evidence-${userId}-${Date.now()}.webm`;
            const filePath = path.join(evidenceDir, fileName);

            fs.writeFileSync(filePath, base64Data, 'base64');
            
            audioUrl = `/evidence/${fileName}`;
            console.log(`🎙️ AUDIO EVIDENCE SAVED: ${fileName}`);
        }

        const newAlert = new Alert({
            user: userId,
            type,
            location,
            audioUrl
        });

        await newAlert.save();

        // Send Email (Don't await this, let it run in background so UI is fast)
        sendEmergencyNotifications(user, { ...newAlert.toObject(), audioUrl }).catch(err => 
            console.error("Background Email Error:", err)
        );

        res.status(201).json(newAlert);

    } catch (error) {
        console.error("Alert Error:", error); // This is where you saw the error!
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// ... (Previous createAlert code remains the same) ...

// --- ADD THIS FUNCTION AT THE BOTTOM ---
export const getAlerts = async (req, res) => {
    try {
        // req.user.id comes from the 'protect' middleware
        // .sort({ createdAt: -1 }) means show newest alerts first
        const alerts = await Alert.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        console.error("Error fetching history:", error);
        res.status(500).json({ message: "Server Error" });
    }
};