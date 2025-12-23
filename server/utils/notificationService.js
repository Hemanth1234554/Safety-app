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
    const mapLink = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;

    // 2. ATTACHMENTS (audio evidence)
    let attachments = [];

    if (alertData.audioUrl) {
        try {
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

    // 3. PREPARE EMAIL CONTENT (HTML & TEXT)
    
    // Create the Video Button (Only if link exists)
    const videoSection = alertData.videoLink ? `
        <div style="margin: 20px 0; text-align: center;">
            <a href="${alertData.videoLink}" style="background-color: #e60000; color: #ffffff; padding: 15px 30px; text-decoration: none; font-weight: bold; font-size: 20px; border-radius: 5px; display: inline-block; font-family: Arial, sans-serif;">
                🎥 WATCH LIVE VIDEO FEED
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">Click immediately to view the live stream.</p>
        </div>
    ` : '';

    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <h1 style="color: #d32f2f; text-align: center;">🚨 SOS ALERT TRIGGERED!</h1>
            
            <p style="font-size: 16px;"><strong>Agent:</strong> ${user.username} needs immediate help.</p>
            <p><strong>Alert Type:</strong> ${alertData.type}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 5px solid #d32f2f; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;">📍 <strong>Live Location:</strong> <a href="${mapLink}">Open in Google Maps</a></p>
                <p style="margin: 5px 0 0; color: #555; font-size: 12px;">Lat: ${lat}, Lng: ${lng}</p>
            </div>

            ${videoSection}

            <p style="font-size: 14px; color: #555;">${alertData.audioUrl ? '🎙️ Audio evidence has been attached to this email.' : ''}</p>
        </div>
    `;

    const textBody = `
URGENT: SOS ALERT TRIGGERED!

Agent: ${user.username}
Alert Type: ${alertData.type}

🎥 WATCH LIVE VIDEO: ${alertData.videoLink || 'N/A'}

📍 Live Location: ${mapLink}

${alertData.audioUrl ? `🎙️ Audio Evidence Attached.` : ''}
Time: ${new Date().toLocaleString()}
    `;

    // 4. LOOP THROUGH CONTACTS
    for (const contact of user.contacts) {
        if (contact.type !== "EMAIL") {
            continue;
        }

        const msg = {
            to: contact.value,
            from: process.env.EMAIL_USER,
            subject: `🚨 SOS ALERT: ${user.username} needs help!`,
            text: textBody, // Fallback for old email clients
            html: htmlBody, // Nice looking HTML version
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