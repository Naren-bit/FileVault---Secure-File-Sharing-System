/**
 * Migration Script: Add ECDH Key Pairs to Existing Users
 * 
 * Run this script once to add key pairs to users who registered
 * before the key exchange feature was implemented.
 * 
 * Usage: node migration-add-ecdh-keys.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { generateKeyPair } = require('./utils/keyExchange');

async function migrateUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find ALL users to regenerate keys with new P-256 curve
        const users = await User.find({}).select('+ecdhPrivateKey');

        console.log(`Found ${users.length} users to update with P-256 curve keys`);

        for (const user of users) {
            const keyPair = generateKeyPair();
            user.ecdhPublicKey = keyPair.publicKey;
            user.ecdhPrivateKey = keyPair.privateKey;
            await user.save();
            console.log(`✓ Generated keys for user: ${user.username}`);
        }

        console.log('\nMigration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateUsers();
