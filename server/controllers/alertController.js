// File: server/controllers/alertController.js
import Alert from '../models/Alert.js';
import User from '../models/User.js';
import { sendEmergencyNotifications } from '../utils/notificationService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Helper to fix file paths in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Create a new Emergency Alert
// @route   POST /api/alerts
export const createAlert = async (req, res) => {
    try {
        const { userId, type, location, audioData } = req.body;

        let audioUrl = '';

        // --- BLACK BOX LOGIC: SAVE AUDIO ---
        if (audioData) {
            // 1. Create a unique filename
            const fileName = `evidence-${userId}-${Date.now()}.webm`;
            const filePath = path.join(__dirname, '../evidence', fileName);

            // 2. Convert Base64 back to binary and save
            // Remove the "data:audio/webm;base64," prefix
            const buffer = Buffer.from(audioData.split(',')[1], 'base64');
            
            fs.writeFileSync(filePath, buffer);
            console.log(`🎙️ AUDIO EVIDENCE SAVED: ${fileName}`);
            
            audioUrl = `/evidence/${fileName}`;
        }

        // 1. Save Alert to Database
        const alert = await Alert.create({
            user: userId,
            type: type || 'PANIC_BUTTON',
            location: {
                latitude: location.latitude,
                longitude: location.longitude,
                address: location.address || 'Unknown Location'
            },
            audioUrl: audioUrl, // Save the link
            status: 'ACTIVE'
        });

        // 2. Notify Contacts
        const user = await User.findById(userId);
        if (user && user.contacts.length > 0) {
            sendEmergencyNotifications(user, alert);
        }

        res.status(201).json({
            success: true,
            message: 'SOS SIGNAL RECEIVED',
            alertId: alert._id
        });

    } catch (error) {
        console.error("Alert Error:", error);
        res.status(500).json({ message: error.message });
    }
};