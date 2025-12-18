// File: server/routes/alertRoutes.js
import express from 'express';
import { createAlert, getAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js'; // Import the Guard

const router = express.Router();

// POST /api/alerts -> Create a new SOS (Protected)
router.post('/', protect, createAlert);

// GET /api/alerts -> Get History (Protected)
router.get('/', protect, getAlerts);

export default router;