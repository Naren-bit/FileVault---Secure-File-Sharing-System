/**
 * AES-256-GCM Encryption Utilities
 * 
 * ============================================================
 * VIVA NOTE - Why AES-256-GCM over AES-256-CBC?
 * ============================================================
 * 
 * AES-256: 
 * - NIST approved, military-grade encryption
 * - 256-bit key = 2^256 possible keys (quantum-resistant)
 * - Used by governments and financial institutions worldwide
 * 
 * GCM (Galois/Counter Mode) vs CBC (Cipher Block Chaining):
 * 
 * 1. AEAD (Authenticated Encryption with Associated Data):
 *    - GCM provides BOTH confidentiality AND integrity in one operation
 *    - CBC only provides confidentiality - needs separate HMAC for integrity
 *    
 * 2. Authentication Tag:
 *    - GCM produces a 16-byte authentication tag
 *    - If ciphertext is modified, decryption FAILS automatically
 *    - CBC has no such protection - silent corruption is possible
 *    
 * 3. Performance:
 *    - GCM is parallelizable (faster on multi-core CPUs)
 *    - CBC must be processed sequentially
 *    
 * 4. Padding Oracle Attacks:
 *    - CBC is vulnerable to padding oracle attacks
 *    - GCM uses counter mode (no padding needed)
 * 
 * ============================================================
 */

const crypto = require('crypto');

// Constants
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;      // 12 bytes (96 bits) - NIST recommended for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes (128 bits) - Maximum security
const KEY_LENGTH = 32;      // 32 bytes (256 bits) for AES-256

/**
 * Generate a cryptographically secure random key
 * Used for File Encryption Keys (FEK)
 */
function generateKey() {
    return crypto.randomBytes(KEY_LENGTH);
}

/**
 * Generate a random Initialization Vector
 * MUST be unique for each encryption operation
 */
function generateIV() {
    return crypto.randomBytes(IV_LENGTH);
}

/**
 * Encrypt a file buffer using AES-256-GCM
 * 
 * @param {Buffer} plainBuffer - The original file content
 * @param {Buffer} key - 32-byte encryption key
 * @returns {Object} { encryptedData, iv, authTag }
 * 
 * VIVA NOTE - Encryption Flow:
 * 1. Generate random IV (ensures same file → different ciphertext)
 * 2. Create cipher with key and IV
 * 3. Encrypt the plaintext
 * 4. Get authentication tag (proves ciphertext wasn't modified)
 */
function encryptFile(plainBuffer, key) {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
        throw new Error(`Key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`);
    }

    // Generate unique IV for this encryption
    const iv = generateIV();

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    // Encrypt the data
    const encryptedData = Buffer.concat([
        cipher.update(plainBuffer),
        cipher.final()
    ]);

    // Get the authentication tag
    const authTag = cipher.getAuthTag();

    return {
        encryptedData,
        iv,
        authTag
    };
}

/**
 * Decrypt a file buffer using AES-256-GCM
 * 
 * @param {Buffer} encryptedBuffer - The encrypted file content
 * @param {Buffer} iv - Initialization vector used during encryption
 * @param {Buffer} authTag - Authentication tag from encryption
 * @param {Buffer} key - 32-byte decryption key
 * @returns {Buffer} Decrypted file content
 * 
 * VIVA NOTE - Decryption Flow:
 * 1. Create decipher with same key and IV
 * 2. Set the authentication tag
 * 3. Decrypt the ciphertext
 * 4. If authTag verification fails → throws error (tampering detected!)
 */
function decryptFile(encryptedBuffer, iv, authTag, key) {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
        throw new Error(`Key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits)`);
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
        authTagLength: AUTH_TAG_LENGTH
    });

    // Set the authentication tag for verification
    decipher.setAuthTag(authTag);

    try {
        // Decrypt the data
        const decryptedData = Buffer.concat([
            decipher.update(encryptedBuffer),
            decipher.final()  // This throws if authTag verification fails
        ]);

        return decryptedData;
    } catch (error) {
        // GCM authentication failed - could be wrong key OR tampering
        // The caller should interpret based on context:
        // - During key decryption: likely wrong password
        // - During file decryption: likely file corruption/tampering
        if (error.message.includes('Unsupported state') ||
            error.message.includes('auth')) {
            throw new Error('AUTH_FAILED: Decryption authentication failed');
        }
        throw error;
    }
}

/**
 * Encrypt file encryption key with user's master key
 * This is the "Key Exchange" simulation
 * 
 * @param {Buffer} fileKey - The random file encryption key
 * @param {Buffer} masterKey - User's derived master key
 * @returns {Object} { encryptedKey, iv, authTag }
 */
function encryptKey(fileKey, masterKey) {
    return encryptFile(fileKey, masterKey);
}

/**
 * Decrypt file encryption key with user's master key
 * 
 * @param {Buffer} encryptedKey - The encrypted file key
 * @param {Buffer} iv - IV used for key encryption
 * @param {Buffer} authTag - Auth tag from key encryption
 * @param {Buffer} masterKey - User's derived master key
 * @returns {Buffer} The decrypted file encryption key
 */
function decryptKey(encryptedKey, iv, authTag, masterKey) {
    return decryptFile(encryptedKey, iv, authTag, masterKey);
}

/**
 * Calculate SHA-256 hash of file content
 * Used for digital signature / integrity verification
 * 
 * VIVA NOTE - Why SHA-256 for signatures (but bcrypt for passwords)?
 * - SHA-256 is FAST: Good for hashing large files quickly
 * - bcrypt is SLOW: Good for passwords (prevents brute force)
 * - Different tools for different jobs!
 */
function calculateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verify file integrity by comparing hashes
 * 
 * @param {Buffer} buffer - File content to verify
 * @param {string} expectedHash - Original SHA-256 hash
 * @returns {boolean} True if file is intact, false if tampered
 */
function verifyIntegrity(buffer, expectedHash) {
    const calculatedHash = calculateHash(buffer);
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(calculatedHash, 'hex'),
        Buffer.from(expectedHash, 'hex')
    );
}

module.exports = {
    generateKey,
    generateIV,
    encryptFile,
    decryptFile,
    encryptKey,
    decryptKey,
    calculateHash,
    verifyIntegrity,
    KEY_LENGTH,
    IV_LENGTH,
    AUTH_TAG_LENGTH
};
