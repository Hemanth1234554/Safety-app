// File: server/routes/alertRoutes.js
import express from 'express';
import { createAlert, getAlerts } from '../controllers/alertController.js'; // Import getAlerts
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to SEND an alert (SOS)
router.post('/', protect, createAlert);

// Route to GET history (The Vault)
router.get('/', protect, getAlerts);

export default router;