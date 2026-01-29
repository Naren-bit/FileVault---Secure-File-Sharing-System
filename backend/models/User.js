/**
 * User Model - Secure Authentication with MFA
 * 
 * VIVA NOTE - Password Hashing:
 * We use bcrypt instead of SHA-256 because:
 * 1. bcrypt is DESIGNED for password hashing (SHA-256 is for general hashing)
 * 2. Adaptive work factor (cost) - can increase as hardware improves
 * 3. Built-in salt prevents rainbow table attacks
 * 4. Deliberately slow to prevent brute-force attacks
 * 
 * Work Factor 12: 2^12 = 4096 iterations, ~250ms per hash
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [30, 'Username cannot exceed 30 characters']
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters'],
        select: false // Never return password in queries by default
    },

    /**
     * VIVA NOTE - Role-Based Access Control (RBAC):
     * Three roles with hierarchical permissions:
     * - admin: Full system access (logs, vault, public)
     * - premium: Can upload/download own encrypted files
     * - guest: Read-only access to public repository (can view and download public files)
     */
    role: {
        type: String,
        enum: ['admin', 'premium', 'guest'],
        default: 'guest'
    },

    // ============ MFA FIELDS ============
    /**
     * VIVA NOTE - Why TOTP over SMS?
     * 1. Not vulnerable to SIM-swapping attacks
     * 2. Works offline (no network required)
     * 3. More secure than SMS which can be intercepted
     * 4. Industry standard (RFC 6238)
     */
    mfaSecret: {
        type: String,
        select: false // Never expose MFA secret
    },

    mfaEnabled: {
        type: Boolean,
        default: false
    },

    mfaVerified: {
        type: Boolean,
        default: false
    },

    // ============ KEY DERIVATION ============
    /**
     * VIVA NOTE - Key Derivation:
     * We store a unique salt per user for PBKDF2 key derivation.
     * The actual encryption key is NEVER stored - it's derived
     * from the user's password + this salt when needed.
     */
    encryptionSalt: {
        type: String,
        select: false
    },

    // ============ RSA KEY EXCHANGE ============
    /**
     * VIVA NOTE - RSA Key Pair for Key Exchange:
     * Each user can have RSA keys for key exchange (optional).
     * With the new RSA approach, guests generate their own keys per-download.
     * These fields are kept for backward compatibility.
     */
    ecdhPublicKey: {
        type: String,
        // Public key can be retrieved for key exchange (optional)
    },

    ecdhPrivateKey: {
        type: String,
        select: false // Private key is NEVER exposed
    },

    // ============ SECURITY METADATA ============
    lastLogin: {
        type: Date
    },

    loginAttempts: {
        type: Number,
        default: 0
    },

    lockUntil: {
        type: Date
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// ============ PRE-SAVE MIDDLEWARE ============
/**
 * VIVA NOTE - Pre-save Hook:
 * This runs BEFORE every save operation.
 * Only hash if password field is modified (not on other updates).
 * Work factor 12 provides good security/performance balance.
 */
userSchema.pre('save', async function (next) {
    // Only hash password if it's modified
    if (!this.isModified('password')) return next();

    try {
        // Generate salt with work factor 12
        const salt = await bcrypt.genSalt(12);
        // Hash the password
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// ============ INSTANCE METHODS ============

/**
 * Compare password for login
 * Uses timing-safe comparison to prevent timing attacks
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Check if account is locked
 */
userSchema.methods.isLocked = function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

/**
 * Increment login attempts and lock if necessary
 */
userSchema.methods.incrementLoginAttempts = async function () {
    // Reset if lock has expired
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }

    // Increment attempts
    const updates = { $inc: { loginAttempts: 1 } };

    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }

    return this.updateOne(updates);
};

// Create indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
