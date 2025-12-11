// File: server/utils/notificationService.js
import nodemailer from 'nodemailer';
import path from 'path';

export const sendEmergencyNotifications = async (user, alertData) => {
    
    // --- 1. SETUP TRANSPORTER (Use SSL Port 465 for Cloud Reliability) ---
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,              // SWITCHED TO PORT 465
        secure: true,           // TRUE for Port 465
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        },
        // --- 2. INCREASE PATIENCE (Fixes Timeouts) ---
        connectionTimeout: 30000, // Wait 30 seconds
        greetingTimeout: 15000,   // Wait 15 seconds for Hello
        socketTimeout: 30000      // Keep socket open longer
    });

    console.log(`\n--- 🚨 INITIATING REAL EMAIL BROADCAST FOR: ${user.username} 🚨 ---`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("❌ CRITICAL ERROR: Email credentials missing.");
        return;
    }

    const lat = alertData.location.latitude;
    const lng = alertData.location.longitude;
    const mapLink = `http://googleusercontent.com/maps.google.com/maps?q=${lat},${lng}`;
    
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
                // 3. SEND WITH AWAIT
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