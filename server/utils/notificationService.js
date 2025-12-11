// File: server/utils/notificationService.js
import sgMail from "@sendgrid/mail";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

export const sendEmergencyNotifications = async (user, alertData) => {

    // 1. INITIALIZE SENDGRID
    if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_USER) {
        console.error("❌ CRITICAL ERROR: SendGrid API Key or EMAIL_USER missing.");
        return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log(`\n--- 🚨 INITIATING SENDGRID BROADCAST FOR: ${user.username} 🚨 ---`);

    const lat = alertData.location.latitude;
    const lng = alertData.location.longitude;

    // FIXED TYPO HERE: changed 2{lat} to ${lat}
    const mapLink = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;

    // 2. ATTACHMENTS (audio evidence)
    let attachments = [];

    if (alertData.audioUrl) {
        try {
            // Adjust path if needed. Assuming audioUrl is relative like '/uploads/...'
            const filePath = `.${alertData.audioUrl}`; 
            
            if (fs.existsSync(filePath)) {
                const fileContent = fs.readFileSync(filePath).toString("base64");

                attachments.push({
                    content: fileContent,
                    filename: "Evidence-Audio.webm",
                    type: "audio/webm",
                    disposition: "attachment"
                });
            } else {
                 console.warn("⚠️ Audio file not found on disk, skipping attachment.");
            }
        } catch (err) {
            console.error("❌ ERROR READING AUDIO FILE:", err.message);
        }
    }

    // 3. LOOP THROUGH CONTACTS
    for (const contact of user.contacts) {
        if (contact.type !== "EMAIL") {
            console.log(`📱 [SMS SIMULATION] To ${contact.name}`);
            continue;
        }

        const messageBody = `
URGENT: SOS ALERT TRIGGERED!

Agent: ${user.username}
Alert Type: ${alertData.type}

📍 Live Location: ${mapLink}

${alertData.audioUrl ? `🎙️ Audio Evidence Attached.` : ''}
Time: ${new Date().toLocaleString()}
        `;

        const msg = {
            to: contact.value,
            from: process.env.EMAIL_USER, // Must match Verified Sender in SendGrid
            subject: `🚨 SOS ALERT: ${user.username} needs help!`,
            text: messageBody,
            attachments: attachments
        };

        try {
            await sgMail.send(msg);
            console.log(`✅ [EMAIL SENT] To ${contact.name} (${contact.value})`);
        } catch (error) {
            console.error(`❌ [EMAIL FAILED] To ${contact.name}:`, error.response ? error.response.body : error.message);
        }
    }

    console.log(`--- ✅ BROADCAST COMPLETE ---\n`);
};