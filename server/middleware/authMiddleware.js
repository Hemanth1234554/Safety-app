// File: server/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // 1. Check if the "Authorization" header exists and starts with "Bearer"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Get the token (remove "Bearer " string)
      token = req.headers.authorization.split(' ')[1];

      // 3. Decode the token using your Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Find the user in the DB and attach to the request
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Pass to the next step (Create Alert)
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};