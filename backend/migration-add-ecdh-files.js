/**
 * Migration Script: Add Key Exchange Fields to Existing Files
 * 
 * Run this script once to add key exchange support to files uploaded
 * before the feature was implemented.
 * 
 * Usage: node migration-add-ecdh-files.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const File = require('./models/File');
const User = require('./models/User');

async function migrateFiles() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find files without key exchange fields
        const files = await File.find({
            $or: [
                { keyExchangeEnabled: { $exists: false } },
                { ownerPublicKey: { $exists: false } },
                { ownerPublicKey: null }
            ]
        }).populate('owner', 'username ecdhPublicKey');

        console.log(`Found ${files.length} files without key exchange fields`);

        for (const file of files) {
            if (file.owner && file.owner.ecdhPublicKey) {
                file.keyExchangeEnabled = true;
                file.ownerPublicKey = file.owner.ecdhPublicKey;
                await file.save();
                console.log(`✓ Updated file: ${file.originalName} (owner: ${file.owner.username})`);
            } else {
                console.log(`⚠ Skipped file: ${file.originalName} - owner has no ECDH key`);
            }
        }

        console.log('\nMigration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

migrateFiles();
