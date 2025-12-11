// File: server/routes/userRoutes.js
import express from 'express';
import { addContact, deleteContact, getContacts } from '../controllers/userController.js';

const router = express.Router();

router.post('/contacts', addContact);
router.post('/contacts/delete', deleteContact); // Using POST for delete to send body easily
router.get('/contacts/:id', getContacts);

export default router;