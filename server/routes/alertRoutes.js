// File: server/routes/alertRoutes.js
import express from 'express';
import { createAlert, getAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to SEND an alert (SOS) - Protected
router.post('/', protect, createAlert);

// Route to GET history (The Vault) - Protected
// We are adding this now so it's ready for the History page later
router.get('/', protect, getAlerts);

export default router;