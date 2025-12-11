// File: server/utils/notificationService.js
import nodemailer from 'nodemailer';

export const sendEmergencyNotifications = async (user, alertData) => {
    
    // --- SENDGRID CONFIGURATION ---
    const transporter = nodemailer.createTransport({
        service: 'SendGrid', // Tells Nodemailer to use SendGrid's settings
        auth: {
            user: 'apikey', // This must ALWAYS be the string "apikey"
            pass: process.env.SENDGRID_API_KEY // Your SG.xxxx key
        }
    });

    console.log(`\n--- 🚨 INITIATING SENDGRID BROADCAST FOR: ${user.username} 🚨 ---`);

    const lat = alertData.location.latitude;
    const lng = alertData.location.longitude;
    const mapLink = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;
    
    // Prepare Attachment
    const emailAttachments = [];
    if (alertData.audioUrl) {
        emailAttachments.push({
            filename: 'Evidence-Audio.webm',
            path: `.${alertData.audioUrl}` 
        });
    }

    for (const contact of user.contacts) {
        const messageBody = `
            URGENT: SOS ALERT TRIGGERED!
            
            Agent: ${user.username}
            Alert Type: ${alertData.type}
            
            📍 Live Location: ${mapLink}
            
            ${alertData.audioUrl ? `🎙️ Audio Evidence Attached.` : ''}
            
            Time: ${new Date().toLocaleString()}
        `;

        if (contact.type === 'EMAIL') {
            try {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER, // Must match the "Verified Sender" in SendGrid
                    to: contact.value,
                    subject: `🚨 SOS ALERT: ${user.username} needs help!`,
                    text: messageBody,
                    attachments: emailAttachments
                });
                console.log(`✅ [EMAIL SENT] To ${contact.name}`);
            } catch (error) {
                console.error(`❌ [EMAIL FAILED] To ${contact.name}:`, error.message);
            }
        } 
    }
    console.log(`--- ✅ BROADCAST COMPLETE ---\n`);
};