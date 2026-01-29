/**
 * Key Derivation Utilities - PBKDF2
 * 
 * ============================================================
 * VIVA NOTE - Why PBKDF2 for Key Derivation?
 * ============================================================
 * 
 * PBKDF2 (Password-Based Key Derivation Function 2):
 * 
 * 1. Purpose:
 *    - Converts a human password into a cryptographic key
 *    - Passwords are predictable (dictionary words, patterns)
 *    - Encryption keys must be random and full-entropy
 *    
 * 2. How it works:
 *    - Applies HMAC-SHA256 repeatedly (iterations)
 *    - Each iteration makes brute-force slower
 *    - Salt prevents rainbow table attacks
 *    
 * 3. Why 100,000 iterations?
 *    - NIST recommends minimum 10,000 (NIST SP 800-132)
 *    - 100,000 takes ~100ms on modern hardware
 *    - Attacker must spend 100ms per password guess
 *    - 1 billion guesses = 3+ years!
 *    
 * 4. Alternatives considered:
 *    - scrypt: More memory-hard, but less standardized
 *    - Argon2: Newer, possibly better, but less library support
 *    - PBKDF2: NIST approved, widely supported, proven secure
 * 
 * ============================================================
 */

const crypto = require('crypto');

// Constants
const SALT_LENGTH = 32;      // 256 bits of salt
const KEY_LENGTH = 32;       // 256 bits output (for AES-256)
const ITERATIONS = 100000;   // NIST recommends minimum 10,000
const DIGEST = 'sha256';     // HMAC-SHA256

/**
 * Generate a cryptographically secure salt
 * Each user gets a unique salt stored in their profile
 */
function generateSalt() {
    return crypto.randomBytes(SALT_LENGTH).toString('hex');
}

/**
 * Derive a master encryption key from user's password
 * 
 * @param {string} password - User's plaintext password
 * @param {string} salt - User's unique salt (hex string)
 * @returns {Promise<Buffer>} 32-byte derived key
 * 
 * VIVA NOTE - Key Derivation Flow:
 * 1. User enters password
 * 2. Retrieve user's salt from database
 * 3. Run PBKDF2 with password + salt + iterations
 * 4. Output is a 256-bit key for AES encryption
 * 5. Key is NEVER stored - derived on-demand
 */
function deriveKey(password, salt) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(
            password,
            Buffer.from(salt, 'hex'),
            ITERATIONS,
            KEY_LENGTH,
            DIGEST,
            (err, derivedKey) => {
                if (err) reject(err);
                else resolve(derivedKey);
            }
        );
    });
}

/**
 * Synchronous version for specific use cases
 * (Use sparingly - blocks event loop)
 */
function deriveKeySync(password, salt) {
    return crypto.pbkdf2Sync(
        password,
        Buffer.from(salt, 'hex'),
        ITERATIONS,
        KEY_LENGTH,
        DIGEST
    );
}

/**
 * Generate a secure random token
 * Used for share links, password reset, etc.
 */
function generateSecureToken(bytes = 32) {
    return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Create a time-limited token with embedded expiry
 * 
 * @param {number} expiryMinutes - Minutes until token expires
 * @returns {Object} { token, expiry }
 */
function generateExpiringToken(expiryMinutes = 60) {
    const token = generateSecureToken();
    const expiry = new Date(Date.now() + expiryMinutes * 60 * 1000);
    return { token, expiry };
}

module.exports = {
    generateSalt,
    deriveKey,
    deriveKeySync,
    generateSecureToken,
    generateExpiringToken,
    ITERATIONS,
    KEY_LENGTH,
    SALT_LENGTH
};
