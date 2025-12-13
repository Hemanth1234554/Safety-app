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

// --- 1. CREATE ALERT (SOS) ---
export const createAlert = async (req, res) => {
    try {
        const { userId, type, location, audioData } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        let audioUrl = null;

        // Save Audio Evidence if it exists
        if (audioData) {
            const base64Data = audioData.replace(/^data:audio\/webm;base64,/, "");
            
            // Define folder and file paths
            const evidenceDir = path.join(__dirname, '../evidence');
            const fileName = `evidence-${userId}-${Date.now()}.webm`;
            const filePath = path.join(evidenceDir, fileName);

            // Create folder if missing
            if (!fs.existsSync(evidenceDir)) {
                fs.mkdirSync(evidenceDir, { recursive: true });
            }

            // Write file
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

        // Send Email in background
        sendEmergencyNotifications(user, { ...newAlert.toObject(), audioUrl }).catch(err => 
            console.error("Background Email Error:", err)
        );

        res.status(201).json(newAlert);

    } catch (error) {
        console.error("Alert Error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// --- 2. GET ALERTS (HISTORY) ---
export const getAlerts = async (req, res) => {
    try {
        // req.user.id comes from the "protect" middleware we just added
        const alerts = await Alert.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        console.error("Fetch History Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};