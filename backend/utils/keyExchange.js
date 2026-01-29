/**
 * RSA Key Exchange Utilities
 * 
 * ============================================================
 * VIVA NOTE - Why RSA for Key Exchange?
 * ============================================================
 * 
 * RSA (Rivest-Shamir-Adleman) is an asymmetric encryption algorithm:
 * 
 * 1. Key Pairs:
 *    - Public Key: Can be shared with anyone safely
 *    - Private Key: Must be kept secret
 *    - Data encrypted with public key can ONLY be decrypted with private key
 *    
 * 2. For Key Exchange:
 *    - Guest generates RSA key pair in browser
 *    - Guest sends PUBLIC key to server
 *    - Server generates random AES key for file encryption
 *    - Server encrypts the AES key with guest's PUBLIC key
 *    - Server sends encrypted file + encrypted AES key
 *    - Guest decrypts AES key with their PRIVATE key (never sent!)
 *    - Guest decrypts file with AES key
 *    
 * 3. Security Properties:
 *    - Private key never leaves the client
 *    - AES key is never transmitted in plaintext
 *    - RSA-OAEP padding prevents various attacks
 *    - Each download uses a fresh AES key
 * 
 * 4. Why RSA-OAEP?
 *    - OAEP = Optimal Asymmetric Encryption Padding
 *    - Prevents padding oracle attacks
 *    - Standard recommended padding for RSA encryption
 * 
 * ============================================================
 */

const crypto = require('crypto');

/**
 * Generate an RSA key pair for a user
 * Used during registration for long-term keys
 */
function generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,  // 2048 bits is secure and fast
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    return { publicKey, privateKey };
}

/**
 * Encrypt data using RSA public key
 * Used to encrypt AES keys for secure transmission
 */
function encryptWithPublicKey(data, publicKeyPem) {
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        Buffer.from(data)
    );
    return encrypted.toString('base64');
}

/**
 * Decrypt data using RSA private key
 * Used to decrypt AES keys received from server
 */
function decryptWithPrivateKey(encryptedData, privateKeyPem) {
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256'
        },
        Buffer.from(encryptedData, 'base64')
    );
    return decrypted;
}

/**
 * Encrypt file data using AES-256-GCM
 * Returns encrypted data, IV, and auth tag
 */
function encryptWithAES(data, aesKey) {
    const iv = crypto.randomBytes(12);  // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);

    const encrypted = Buffer.concat([
        cipher.update(data),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
        data: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * Generate a random AES key
 */
function generateAESKey() {
    return crypto.randomBytes(32);  // 256 bits
}

/**
 * Encrypt file for key exchange download
 * 1. Generate random AES key
 * 2. Encrypt file with AES key
 * 3. Encrypt AES key with guest's RSA public key
 */
function encryptForKeyExchange(fileData, guestPublicKey) {
    // Generate fresh AES key for this transfer
    const aesKey = generateAESKey();

    // Encrypt file with AES
    const encryptedFile = encryptWithAES(fileData, aesKey);

    // Encrypt AES key with guest's RSA public key
    const encryptedAESKey = encryptWithPublicKey(aesKey, guestPublicKey);

    return {
        encryptedFile,
        encryptedAESKey
    };
}

module.exports = {
    generateKeyPair,
    encryptWithPublicKey,
    decryptWithPrivateKey,
    encryptWithAES,
    generateAESKey,
    encryptForKeyExchange
};
