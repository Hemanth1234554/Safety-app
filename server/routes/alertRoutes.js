// File: server/routes/alertRoutes.js
import express from 'express';
import { createAlert , getAlerts } from '../controllers/alertController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', createAlert);

router.get('/', protect, getAlerts);

export default router;