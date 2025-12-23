// File: server/routes/alertRoutes.js
import express from 'express';
import multer from 'multer';
import { createAlert } from '../controllers/alertController.js';

const router = express.Router();

// 1. Setup Multer (The Package Opener)
// We use memoryStorage so we can access the file buffer immediately
const upload = multer({ storage: multer.memoryStorage() });

// 2. Apply Middleware
// 'upload.single("audio")' looks for the file named "audio" sent from frontend
router.post('/', upload.single('audio'), createAlert);

export default router;