// File: server/controllers/userController.js
import User from '../models/User.js';

// @desc    Add a new contact
// @route   POST /api/user/contacts
export const addContact = async (req, res) => {
    try {
        const { userId, name, type, value } = req.body;
        
        const user = await User.findById(userId);
        if (user) {
            user.contacts.push({ name, type, value });
            await user.save();
            res.status(201).json(user.contacts);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a contact
// @route   DELETE /api/user/contacts/:id
export const deleteContact = async (req, res) => {
    try {
        const { userId, contactId } = req.body;
        
        const user = await User.findById(userId);
        if (user) {
            // Remove contact by ID
            user.contacts = user.contacts.filter(c => c._id.toString() !== contactId);
            await user.save();
            res.json(user.contacts);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all contacts
// @route   GET /api/user/contacts/:id
export const getContacts = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(user) {
            res.json(user.contacts);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}