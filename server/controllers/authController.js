// File: server/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register a new user
export const registerUser = async (req, res) => {
    try {
        const { username, email, password, safePin, panicPin, adminPin } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            safePin,
            panicPin,
            adminPin 
        });

        if (user) {
            // FIX: We must send the PINs back so the app knows them immediately
            res.status(201).json({
                _id: user.id,
                username: user.username,
                email: user.email,
                safePin: user.safePin,   // <--- Added this
                panicPin: user.panicPin, // <--- Added this
                adminPin: user.adminPin, // <--- Added this
                token: generateToken(user.id),
                message: "User Registered Successfully"
            });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Login & Authenticate User
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                username: user.username,
                email: user.email,
                safePin: user.safePin,
                panicPin: user.panicPin,
                adminPin: user.adminPin,
                token: generateToken(user.id)
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};