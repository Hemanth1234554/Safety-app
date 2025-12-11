// File: server/config/db.js
import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // 1. Attempt to connect using the secret URL
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        console.log(`MONGODB CONNECTED: ${conn.connection.host}`);
    } catch (error) {
        // 2. If connection fails, show error and stop server (Safety feature)
        console.error(`Error: ${error.message}`);
        process.exit(1); 
    }
};

export default connectDB;