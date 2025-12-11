// File: server/models/Alert.js
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },
    audioUrl: { type: String },
    type: { 
        type: String, 
        // ADD 'BATTERY_CRITICAL' TO THIS LIST:
        enum: ['PANIC_BUTTON', 'DEAD_MAN_SWITCH', 'VOICE_TRIGGER', 'PANIC_BUTTON_SILENT', 'BATTERY_CRITICAL'], 
        default: 'PANIC_BUTTON' 
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'RESOLVED', 'FALSE_ALARM'],
        default: 'ACTIVE'
    }
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);