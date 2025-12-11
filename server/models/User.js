// File: server/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // THE 3 PINS
    safePin:  { type: String, required: true }, // Opens SOS Dashboard
    panicPin: { type: String, required: true }, // Triggers Silent Alarm
    adminPin: { type: String, required: true }, // Opens Settings/Contacts
    
    // Emergency Contacts List
    contacts: [{
        name: String,
        type: { type: String, enum: ['PHONE', 'EMAIL'], default: 'PHONE' },
        value: String
    }]
}, { timestamps: true });

export default mongoose.model('User', userSchema);