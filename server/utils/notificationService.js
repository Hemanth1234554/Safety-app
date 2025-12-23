// File: server/utils/notificationService.js
import sgMail from "@sendgrid/mail";
import fs from "fs";
import dotenv from 'dotenv';

dotenv.config();

export const sendEmergencyNotifications = async (user, alertData) => {

    if (!process.env.SENDGRID_API_KEY || !process.env.EMAIL_USER) {
        console.error("❌ CRITICAL ERROR: SendGrid config missing.");
        return;
    }

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    console.log(`\n--- 🚨 SENDING ALERT FOR: ${user.username} ---`);

    const lat = alertData.location.latitude;
    const lng = alertData.location.longitude;

    // FIX: Use simple, standard Google Maps Link
    const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;

    // 1. HANDLE AUDIO ATTACHMENT
    let attachments = [];
    if (alertData.audioUrl) {
        try {
            const filePath = `.${alertData.audioUrl}`;
            if (fs.existsSync(filePath)) {
                attachments.push({
                    content: fs.readFileSync(filePath).toString("base64"),
                    filename: "Evidence-Audio.webm",
                    type: "audio/webm",
                    disposition: "attachment"
                });
            }
        } catch (err) {
            console.error("❌ Audio Read Error:", err.message);
        }
    }

    // 2. CREATE THE RED VIDEO BUTTON (The Visual Part)
    // We check if 'videoLink' exists. If yes, we add HTML for a red button.
    const videoSection = alertData.videoLink ? `
        <div style="margin: 25px 0; text-align: center;">
            <a href="${alertData.videoLink}" 
               style="background-color: #ff0000; color: #ffffff; padding: 15px 30px; 
                      text-decoration: none; font-weight: bold; font-size: 20px; 
                      border-radius: 5px; display: inline-block; font-family: Arial, sans-serif;">
                🎥 WATCH LIVE VIDEO FEED
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">
                Click immediately to view the live stream.
            </p>
        </div>
    ` : '';

    // 3. BUILD THE EMAIL HTML
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px;">
            <h1 style="color: #d32f2f; text-align: center;">🚨 SOS ALERT TRIGGERED!</h1>
            
            <p style="font-size: 16px;"><strong>Agent:</strong> ${user.username}</p>
            <p><strong>Alert Type:</strong> ${alertData.type}</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-left: 5px solid #d32f2f; margin: 20px 0;">
                <p style="margin: 0; font-size: 16px;">📍 <strong>Live Location:</strong> <a href="${mapLink}">Open in Google Maps</a></p>
                <p style="margin: 5px 0 0; color: #555; font-size: 12px;">Lat: ${lat}, Lng: ${lng}</p>
            </div>

            ${videoSection}

            <p style="font-size: 14px; color: #555;">${alertData.audioUrl ? '🎙️ Audio evidence attached.' : ''}</p>
        </div>
    `;

    // 4. SEND TO ALL EMAIL CONTACTS
    for (const contact of user.contacts) {
        if (contact.type !== "EMAIL") continue;

        const msg = {
            to: contact.value,
            from: process.env.EMAIL_USER,
            subject: `🚨 SOS ALERT: ${user.username} needs help!`,
            html: htmlBody,
            attachments: attachments
        };

        try {
            await sgMail.send(msg);
            console.log(`✅ [EMAIL SENT] To ${contact.name}`);
        } catch (error) {
            console.error(`❌ [EMAIL FAILED] To ${contact.name}:`, error.response ? error.response.body : error.message);
        }
    }
};