/**
 * File Model - Encrypted File Metadata Storage
 * 
 * VIVA NOTE - Digital Signatures:
 * We store a SHA-256 hash of the ORIGINAL file content.
 * On download, we recalculate the hash and compare.
 * This ensures file integrity - any tampering is detected.
 * 
 * SHA-256 is used for signatures (not passwords) because:
 * 1. Fast to compute (needed for large files)
 * 2. Collision-resistant (virtually impossible to find two files with same hash)
 * 3. NIST approved for digital signatures
 */

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    // Original file information
    originalName: {
        type: String,
        required: [true, 'Original filename is required']
    },

    mimeType: {
        type: String,
        required: true
    },

    size: {
        type: Number,
        required: true
    },

    // Encrypted file storage path
    encryptedPath: {
        type: String,
        required: true
    },

    // ============ OWNERSHIP & ACCESS ============
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    /**
     * VIVA NOTE - Access Levels:
     * 'vault': Only owner and admins can access (encrypted personal files)
     * 'public': All authenticated users can view/download
     */
    accessLevel: {
        type: String,
        enum: ['vault', 'public'],
        default: 'vault'
    },

    // ============ ENCRYPTION METADATA ============
    /**
     * VIVA NOTE - Why store IV and authTag?
     * 
     * IV (Initialization Vector):
     * - Random 12 bytes for AES-GCM (NIST recommended)
     * - Ensures same file encrypted twice produces different ciphertext
     * - Must be unique per encryption but doesn't need to be secret
     * 
     * authTag (Authentication Tag):
     * - 16-byte tag produced by GCM mode
     * - Used to verify ciphertext hasn't been modified
     * - If verification fails, decryption is rejected
     */
    iv: {
        type: String,  // Stored as hex string
        required: true
    },

    authTag: {
        type: String,  // Stored as hex string
        required: true
    },

    /**
     * VIVA NOTE - Key Exchange Simulation:
     * The file is encrypted with a random File Encryption Key (FEK).
     * The FEK is then encrypted with the user's Master Key (derived from password).
     * This allows key rotation without re-encrypting all files.
     */
    encryptedKey: {
        type: String,  // FEK encrypted with user's master key
        required: true
    },

    /**
     * VIVA NOTE - File-Specific Salt:
     * For public files, we use a file-specific salt instead of user's salt.
     * This allows anyone with the password to derive the correct key.
     * Without this, only the original uploader could decrypt.
     */
    fileSalt: {
        type: String,  // Random salt for this specific file
        required: false  // Optional for backward compatibility with old files
    },

    // ============ DIGITAL SIGNATURE ============
    /**
     * VIVA NOTE - SHA-256 Hash for Integrity:
     * This hash is computed from the ORIGINAL unencrypted file.
     * On download, after decryption, we recalculate and compare.
     * Any mismatch means the file was tampered with.
     */
    sha256Hash: {
        type: String,
        required: true
    },

    // ============ KEY EXCHANGE ============
    /**
     * VIVA NOTE - RSA Key Exchange for Sharing:
     * Instead of sharing the password, we use RSA key exchange.
     * - Guest generates RSA key pair in browser
     * - Guest sends public key to server
     * - Server encrypts AES key with guest's public key
     * - Guest decrypts with their private key (never sent!)
     */
    keyExchangeEnabled: {
        type: Boolean,
        default: true  // Enable by default for new files
    },

    ownerPublicKey: {
        type: String  // Owner's RSA public key (optional, for reference)
    },

    // ============ SHARING ============
    shareToken: {
        type: String,
        unique: true,
        sparse: true  // Allows multiple null values
    },

    shareExpiry: {
        type: Date
    },

    downloadCount: {
        type: Number,
        default: 0
    },

    // ============ METADATA ============
    description: {
        type: String,
        maxlength: 500
    },

    tags: [{
        type: String,
        trim: true
    }],

    isDeleted: {
        type: Boolean,
        default: false
    },

    deletedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
fileSchema.index({ owner: 1 });
fileSchema.index({ accessLevel: 1 });
fileSchema.index({ shareToken: 1 });
fileSchema.index({ createdAt: -1 });

// Virtual for file age
fileSchema.virtual('age').get(function () {
    return Date.now() - this.createdAt;
});

// Don't return deleted files by default
fileSchema.pre(/^find/, function (next) {
    this.find({ isDeleted: { $ne: true } });
    next();
});

const File = mongoose.model('File', fileSchema);

module.exports = File;
