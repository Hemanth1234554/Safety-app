// File: server/utils/notificationService.js
import nodemailer from 'nodemailer';
import path from 'path';

export const sendEmergencyNotifications = async (user, alertData) => {
    // 1. USE THE ROBUST CONFIGURATION (Fixes the freezing/blocking issue)
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', // Explicitly verify server
        port: 587,              // Use TLS Port (Firewall friendly)
        secure: false,          // False for TLS
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false // Fixes "Self Signed Certificate" errors from Antivirus
        }
    });

    console.log(`\n--- 🚨 INITIATING REAL EMAIL BROADCAST FOR: ${user.username} 🚨 ---`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ CRITICAL ERROR: Email credentials missing.");
        return;
    }

    const lat = alertData.location.latitude;
    const lng = alertData.location.longitude;
    
    // 2. FIXED TYPO: Changed 0{lat} to ${lat}
    const mapLink = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;
    
    // 3. PREPARE ATTACHMENTS
    const emailAttachments = [];
    if (alertData.audioUrl) {
        emailAttachments.push({
            filename: 'Evidence-Audio.webm',
            path: `.${alertData.audioUrl}`
        });
    }

    // 4. Loop through contacts
    for (const contact of user.contacts) {
        const messageBody = `
            URGENT: SOS ALERT TRIGGERED!
            
            Agent: ${user.username}
            Alert Type: ${alertData.type}
            
            📍 Live Location: ${mapLink}
            
            ${alertData.audioUrl ? `🎙️ Audio Evidence Attached to this email.` : ''}
            
            Time: ${new Date().toLocaleString()}
        `;

        if (contact.type === 'EMAIL') {
            try {
                await transporter.sendMail({
                    from: `"Ghost Protocol HQ" <${process.env.EMAIL_USER}>`,
                    to: contact.value,
                    subject: `🚨 SOS ALERT: ${user.username} needs help!`,
                    text: messageBody,
                    attachments: emailAttachments
                });
                console.log(`✅ [EMAIL SENT] To ${contact.name} (${contact.value})`);
            } catch (error) {
                console.error(`❌ [EMAIL FAILED] To ${contact.name}:`, error.message);
            }
        } 
        else if (contact.type === 'PHONE') {
            console.log(`📱 [SMS SIMULATION] To ${contact.name}: ${messageBody}`);
        }
    }
    
    console.log(`--- ✅ BROADCAST COMPLETE ---\n`);
};