/**
 * Database Configuration - MongoDB Connection
 * 
 * VIVA NOTE: We use Mongoose as ODM for MongoDB because:
 * 1. Schema validation ensures data integrity
 * 2. Built-in connection pooling for performance
 * 3. Middleware hooks (pre-save) for password hashing
 */

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // These options are now defaults in Mongoose 6+
            // Keeping for explicit documentation
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error(`❌ MongoDB Error: ${err.message}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected. Attempting reconnection...');
        });

    } catch (error) {
        console.error(`❌ MongoDB Connection Failed: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
