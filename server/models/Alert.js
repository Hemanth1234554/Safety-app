// File: server/models/Alert.js
import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        // <--- WE ADDED 'SENTINEL_AI_TRIGGER' HERE
        enum: ['PANIC_BUTTON', 'BATTERY_CRITICAL', 'SENTINEL_AI_TRIGGER', 'FAKE_CALL'], 
        default: 'PANIC_BUTTON'
    },
    location: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String } // Optional address
    },
    audioUrl: {
        type: String // URL to the audio evidence
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'RESOLVED'],
        default: 'ACTIVE'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Alert = mongoose.model('Alert', alertSchema);
export default Alert;