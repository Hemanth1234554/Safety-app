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
        // ✅ CORRECT: This list allows the Sentinel AI to work
        enum: ['PANIC_BUTTON', 'BATTERY_CRITICAL', 'SENTINEL_AI_TRIGGER', 'FAKE_CALL', 'CRASH_DETECTED'],
        default: 'PANIC_BUTTON'
    },
    location: {
        // ✅ SAFETY UPDATE: Added defaults so it won't crash if GPS is 0
        latitude: { type: Number, default: 0 },
        longitude: { type: Number, default: 0 },
        address: { type: String, default: '' }
    },
    audioUrl: {
        type: String
    },
    // ✅ NEW ADDITION: Needed for the "Watch Live" email button
    videoLink: {
        type: String
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