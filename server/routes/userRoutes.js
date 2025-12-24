// File: server/routes/userRoutes.js
import express from 'express';
import { addContact, getContacts, deleteContact } from '../controllers/userController.js';

const router = express.Router();

router.post('/contacts', addContact);
router.get('/contacts', getContacts);

// <--- NEW: DELETE ROUTE
// We use a parameter :contactId so the server knows which one to kill
router.delete('/contacts/:contactId', deleteContact);

export default router;