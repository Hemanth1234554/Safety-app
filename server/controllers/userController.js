// File: server/controllers/userController.js
import User from '../models/User.js';

// Add a Contact
export const addContact = async (req, res) => {
    const { userId, name, phone, email } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // FIX: Changed "SMS" to "PHONE" to match the Database Schema
        const newContact = { 
            name, 
            value: phone || email, 
            type: phone ? "PHONE" : "EMAIL" 
        };
        
        user.contacts.push(newContact);
        await user.save();
        
        res.status(201).json(user.contacts);
    } catch (error) {
        console.error("Add Contact Error:", error); // Added logging to see errors in Render
        res.status(500).json({ message: "Server Error" });
    }
};

// Get All Contacts
export const getContacts = async (req, res) => {
    try {
        const { userId } = req.query; 
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        
        res.json(user.contacts);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
};

// Delete Contact
export const deleteContact = async (req, res) => {
    try {
        const { contactId } = req.params;
        const { userId } = req.body; 

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.contacts = user.contacts.filter(contact => contact._id.toString() !== contactId);
        
        await user.save();
        res.json(user.contacts); 
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};