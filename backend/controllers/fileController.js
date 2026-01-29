/**
 * File Controller
 * 
 * Handles: Upload, Download, Share via QR, Delete
 * 
 * ============================================================
 * VIVA NOTE - Encryption & Integrity Flow
 * ============================================================
 * 
 * UPLOAD FLOW:
 * 1. Receive file in memory (multer)
 * 2. Calculate SHA-256 hash of original content (digital signature)
 * 3. Generate random File Encryption Key (FEK)
 * 4. Encrypt file with FEK using AES-256-GCM
 * 5. Encrypt FEK with user's master key (key exchange)
 * 6. Store encrypted file and metadata
 * 
 * DOWNLOAD FLOW:
 * 1. Verify user has access (ACL check)
 * 2. Decrypt FEK with user's master key
 * 3. Decrypt file with FEK
 * 4. Recalculate SHA-256 hash
 * 5. Compare with stored hash (integrity check)
 * 6. Return file with integrity status
 * 
 * ============================================================
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const AuditLog = require('../models/AuditLog');
const encryption = require('../utils/encryption');
const keyDerivation = require('../utils/keyDerivation');
const { generateShareQRCode } = require('../utils/qrGenerator');
const { getClientIP } = require('../middleware/authMiddleware');
const User = require('../models/User');
const keyExchange = require('../utils/keyExchange');

// Upload directory
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Ensure upload directory exists
async function ensureUploadDir() {
    try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') throw error;
    }
}

/**
 * Upload and encrypt a file
 * POST /api/files/upload
 */
const uploadFile = async (req, res) => {
    try {
        await ensureUploadDir();

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded.'
            });
        }

        const { accessLevel = 'vault', description = '' } = req.body;
        const fileBuffer = req.file.buffer;

        // Get user with encryption salt
        const user = await User.findById(req.user._id).select('+encryptionSalt');

        if (!user.encryptionSalt) {
            return res.status(500).json({
                success: false,
                message: 'User encryption not configured.'
            });
        }

        /**
         * STEP 1: Calculate SHA-256 hash of original content
         * This is our "digital signature" for integrity verification
         */
        const sha256Hash = encryption.calculateHash(fileBuffer);

        /**
         * STEP 2: Generate random File Encryption Key (FEK)
         * Each file gets its own key for forward secrecy
         */
        const fileKey = encryption.generateKey();

        /**
         * STEP 3: Encrypt the file with AES-256-GCM
         */
        const encryptedFile = encryption.encryptFile(fileBuffer, fileKey);

        /**
         * STEP 4: Generate FILE-SPECIFIC salt for key derivation
         * VIVA NOTE: We use a file-specific salt (not user's salt) so that
         * anyone who knows the password can derive the same key.
         * This enables sharing of public files.
         */
        const userPassword = req.body.password || req.headers['x-encryption-password'];

        if (!userPassword) {
            return res.status(400).json({
                success: false,
                message: 'Encryption password required.'
            });
        }

        // Generate a new salt specific to this file
        const fileSalt = keyDerivation.generateSalt();
        const masterKey = await keyDerivation.deriveKey(userPassword, fileSalt);

        /**
         * STEP 5: Encrypt the FEK with master key (Key Exchange)
         * This allows key rotation without re-encrypting files
         */
        const encryptedKeyData = encryption.encryptKey(fileKey, masterKey);

        // Generate unique filename
        const encryptedFilename = `${uuidv4()}.enc`;
        const encryptedPath = path.join(UPLOAD_DIR, encryptedFilename);

        /**
         * STEP 6: Write encrypted file to disk
         */
        await fs.writeFile(encryptedPath, encryptedFile.encryptedData);

        // Create file record in database
        const file = await File.create({
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size,
            encryptedPath: encryptedFilename,
            owner: req.user._id,
            accessLevel,
            description,

            // Encryption metadata
            iv: encryptedFile.iv.toString('hex'),
            authTag: encryptedFile.authTag.toString('hex'),

            // File-specific salt for key derivation
            fileSalt: fileSalt,

            // Encrypted FEK (for key exchange)
            encryptedKey: JSON.stringify({
                data: encryptedKeyData.encryptedData.toString('hex'),
                iv: encryptedKeyData.iv.toString('hex'),
                authTag: encryptedKeyData.authTag.toString('hex')
            }),

            // RSA Key Exchange support
            keyExchangeEnabled: true,
            ownerPublicKey: req.user.ecdhPublicKey,

            // Digital signature
            sha256Hash
        });

        // Audit log
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'FILE_UPLOAD',
            target: file._id.toString(),
            targetType: 'file',
            status: 'SUCCESS',
            details: {
                filename: req.file.originalname,
                size: req.file.size,
                accessLevel,
                encrypted: true,
                algorithm: 'AES-256-GCM'
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            message: 'File uploaded and encrypted successfully.',
            data: {
                file: {
                    id: file._id,
                    name: file.originalName,
                    size: file.size,
                    accessLevel: file.accessLevel,
                    createdAt: file.createdAt,
                    encryption: {
                        algorithm: 'AES-256-GCM',
                        keyDerivation: 'PBKDF2-SHA256'
                    },
                    integrity: {
                        algorithm: 'SHA-256',
                        hash: sha256Hash.substring(0, 16) + '...'  // Truncated for display
                    }
                }
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'File upload failed.'
        });
    }
};

/**
 * Download and decrypt a file
 * GET /api/files/:id/download
 */
const downloadFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        // Check access based on access level and ownership
        if (file.accessLevel === 'vault') {
            // Vault files: only owner and admin
            if (req.user.role !== 'admin' &&
                file.owner.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied.'
                });
            }
        }

        /**
         * STEP 1: Derive key using FILE'S salt (not user's salt)
         * VIVA NOTE: Using file-specific salt allows anyone with the password
         * to derive the same encryption key, enabling file sharing.
         */
        const userPassword = req.body.password || req.headers['x-encryption-password'];

        if (!userPassword) {
            return res.status(400).json({
                success: false,
                message: 'Decryption password required.'
            });
        }

        // For new files: use file's salt. For old files: use owner's salt
        let saltToUse = file.fileSalt;
        if (!saltToUse) {
            // Fallback for old files - only owner can decrypt
            const owner = await User.findById(file.owner).select('+encryptionSalt');
            saltToUse = owner?.encryptionSalt;
            if (!saltToUse) {
                return res.status(500).json({
                    success: false,
                    message: 'File encryption metadata missing.'
                });
            }
        }

        const masterKey = await keyDerivation.deriveKey(userPassword, saltToUse);

        // DEBUG: Log key derivation info
        console.log('Download attempt:', {
            fileName: file.originalName,
            hasFileSalt: !!file.fileSalt,
            saltUsed: saltToUse ? saltToUse.substring(0, 16) + '...' : 'NONE',
            passwordLength: userPassword?.length
        });

        // Parse encrypted key data
        const encryptedKeyData = JSON.parse(file.encryptedKey);

        /**
         * STEP 1: Decrypt the File Encryption Key
         */
        let fileKey;
        try {
            fileKey = encryption.decryptKey(
                Buffer.from(encryptedKeyData.data, 'hex'),
                Buffer.from(encryptedKeyData.iv, 'hex'),
                Buffer.from(encryptedKeyData.authTag, 'hex'),
                masterKey
            );
            console.log('Decryption SUCCESS for:', file.originalName);
        } catch (error) {
            console.log('Key decryption FAILED for:', file.originalName, '- Likely wrong password. Error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Invalid decryption password.'
            });
        }

        // Read encrypted file
        const encryptedData = await fs.readFile(
            path.join(UPLOAD_DIR, file.encryptedPath)
        );

        /**
         * STEP 2: Decrypt the file content
         */
        let decryptedData;
        try {
            decryptedData = encryption.decryptFile(
                encryptedData,
                Buffer.from(file.iv, 'hex'),
                Buffer.from(file.authTag, 'hex'),
                fileKey
            );
        } catch (error) {
            // GCM authentication failed
            await AuditLog.log({
                actorId: req.user._id,
                actorUsername: req.user.username,
                actorRole: req.user.role,
                action: 'INTEGRITY_CHECK_FAILED',
                target: file._id.toString(),
                targetType: 'file',
                status: 'FAILED',
                details: { reason: 'GCM authentication failed' },
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent']
            });

            return res.status(500).json({
                success: false,
                message: 'File integrity check failed. File may be corrupted.',
                integrity: {
                    status: 'FAILED',
                    reason: 'Encryption authentication failed'
                }
            });
        }

        /**
         * STEP 3: Verify SHA-256 hash (Digital Signature)
         */
        const integrityPassed = encryption.verifyIntegrity(decryptedData, file.sha256Hash);

        // Log integrity check result
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: integrityPassed ? 'INTEGRITY_CHECK_PASSED' : 'INTEGRITY_CHECK_FAILED',
            target: file._id.toString(),
            targetType: 'file',
            status: integrityPassed ? 'SUCCESS' : 'FAILED',
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        if (!integrityPassed) {
            return res.status(500).json({
                success: false,
                message: 'File integrity check failed. File has been tampered with.',
                integrity: {
                    status: 'FAILED',
                    reason: 'SHA-256 hash mismatch'
                }
            });
        }

        // Update download count
        file.downloadCount += 1;
        await file.save();

        // Log download
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'FILE_DOWNLOAD',
            target: file._id.toString(),
            targetType: 'file',
            status: 'SUCCESS',
            details: { filename: file.originalName },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        // Set response headers
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('X-Integrity-Status', 'PASSED');
        res.setHeader('X-Encryption-Algorithm', 'AES-256-GCM');

        res.status(200).send(decryptedData);

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({
            success: false,
            message: 'File download failed.'
        });
    }
};

/**
 * Get user's files
 * GET /api/files
 */
const getFiles = async (req, res) => {
    try {
        const { accessLevel, page = 1, limit = 20 } = req.query;

        let query = {};

        // Filter based on user role
        if (req.user.role === 'admin') {
            // Admin can see all files
            if (accessLevel) query.accessLevel = accessLevel;
        } else if (req.user.role === 'premium') {
            // Premium users see own files + public files
            query.$or = [
                { owner: req.user._id },
                { accessLevel: 'public' }
            ];
        } else {
            // Guests only see public files
            query.accessLevel = 'public';
        }

        const files = await File.find(query)
            .populate('owner', 'username')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await File.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                files: files.map(f => ({
                    id: f._id,
                    name: f.originalName,
                    size: f.size,
                    mimeType: f.mimeType,
                    accessLevel: f.accessLevel,
                    owner: f.owner?.username,
                    isOwner: f.owner?._id.toString() === req.user._id.toString(),
                    downloadCount: f.downloadCount,
                    createdAt: f.createdAt,
                    encryption: {
                        algorithm: 'AES-256-GCM',
                        status: 'encrypted'
                    }
                })),
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch files.'
        });
    }
};

/**
 * Generate QR code for file sharing
 * POST /api/files/:id/share
 */
const shareFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        // Check ownership (only owner or admin can share)
        if (req.user.role !== 'admin' &&
            file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied.'
            });
        }

        // Generate share token
        const { token, expiry } = keyDerivation.generateExpiringToken(
            req.body.expiryMinutes || 60  // Default 1 hour
        );

        file.shareToken = token;
        file.shareExpiry = expiry;
        await file.save();

        // Generate share URL
        const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}`;

        // Generate QR code
        const qrCode = await generateShareQRCode(shareUrl);

        // Log share action
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'FILE_SHARE',
            target: file._id.toString(),
            targetType: 'file',
            status: 'SUCCESS',
            details: {
                filename: file.originalName,
                expiresAt: expiry
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'Share link generated successfully.',
            data: {
                shareUrl,
                qrCode,
                expiresAt: expiry,
                token
            }
        });

    } catch (error) {
        console.error('Share error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate share link.'
        });
    }
};

/**
 * Delete a file
 * DELETE /api/files/:id
 */
const deleteFile = async (req, res) => {
    try {
        const file = await File.findById(req.params.id);

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        // Check ownership
        if (req.user.role !== 'admin' &&
            file.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied.'
            });
        }

        // Soft delete
        file.isDeleted = true;
        file.deletedAt = new Date();
        await file.save();

        // Also delete the encrypted file from disk
        try {
            await fs.unlink(path.join(UPLOAD_DIR, file.encryptedPath));
        } catch (fsError) {
            console.warn('Could not delete file from disk:', fsError.message);
        }

        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'FILE_DELETE',
            target: file._id.toString(),
            targetType: 'file',
            status: 'SUCCESS',
            details: { filename: file.originalName },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'File deleted successfully.'
        });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete file.'
        });
    }
};

/**
 * Get file info for shared link
 * GET /api/files/share/:token
 */
const getSharedFile = async (req, res) => {
    try {
        const file = await File.findOne({
            shareToken: req.params.token,
            shareExpiry: { $gt: new Date() }
        }).populate('owner', 'username');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'Share link expired or invalid.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                file: {
                    id: file._id,
                    name: file.originalName,
                    size: file.size,
                    mimeType: file.mimeType,
                    owner: file.owner?.username,
                    expiresAt: file.shareExpiry
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch shared file.'
        });
    }
};

/**
 * Download file using RSA Key Exchange
 * POST /api/files/:id/key-exchange
 /**
 * ============================================================
 * VIVA NOTE - RSA Key Exchange for File Download
 * ============================================================
 * 
 * This is a TRUE key exchange using RSA asymmetric encryption!
 * 
 * Flow:
 * 1. Guest generates RSA key pair in browser
 * 2. Guest sends their PUBLIC key to server
 * 3. Server reads the encrypted file
 * 4. Server generates a random AES key
 * 5. Server encrypts file with AES key
 * 6. Server encrypts AES key with guest's RSA PUBLIC key
 * 7. Server sends encrypted file + encrypted AES key
 * 8. Guest decrypts AES key with their PRIVATE key (never sent!)
 * 9. Guest decrypts file with AES key
 * 
 * Security:
 * - Guest's private key NEVER leaves the browser
 * - AES key is NEVER transmitted in plaintext
 * - Each download uses a fresh AES key
 * - RSA-OAEP padding prevents attacks
 * ============================================================
 */
const keyExchangeDownload = async (req, res) => {
    try {
        const { guestPublicKey } = req.body;

        if (!guestPublicKey) {
            return res.status(400).json({
                success: false,
                message: 'Guest public key is required for key exchange.'
            });
        }

        const file = await File.findById(req.params.id).populate('owner', 'username');

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File not found.'
            });
        }

        // Check if key exchange is enabled for this file
        if (!file.keyExchangeEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Key exchange not available for this file. Use password-based download.'
            });
        }

        // Read encrypted file from disk
        const encryptedData = await fs.readFile(
            path.join(UPLOAD_DIR, file.encryptedPath)
        );

        /**
         * For RSA key exchange, we encrypt the file with a fresh AES key,
         * then encrypt that AES key with the guest's RSA public key.
         * The guest decrypts the AES key with their private key (in browser).
         */
        const result = keyExchange.encryptForKeyExchange(encryptedData, guestPublicKey);

        // Log key exchange
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'KEY_EXCHANGE_DOWNLOAD',
            target: file._id.toString(),
            targetType: 'file',
            status: 'SUCCESS',
            details: {
                filename: file.originalName,
                method: 'RSA-2048-OAEP + AES-256-GCM'
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        // Update download count
        file.downloadCount += 1;
        await file.save();

        res.status(200).json({
            success: true,
            message: 'Key exchange successful. File encrypted with RSA-exchanged key.',
            data: {
                file: {
                    id: file._id,
                    name: file.originalName,
                    size: file.size,
                    mimeType: file.mimeType
                },
                encryption: {
                    method: 'RSA-2048-OAEP + AES-256-GCM'
                },
                // Encrypted file data
                encryptedFile: result.encryptedFile,
                // AES key encrypted with guest's RSA public key
                encryptedAESKey: result.encryptedAESKey,
                // Original file metadata for verification
                originalEncryption: {
                    iv: file.iv,
                    authTag: file.authTag
                },
                sha256Hash: file.sha256Hash
            }
        });

    } catch (error) {
        console.error('Key exchange download error:', error);
        res.status(500).json({
            success: false,
            message: 'Key exchange download failed: ' + error.message
        });
    }
};

module.exports = {
    uploadFile,
    downloadFile,
    getFiles,
    shareFile,
    deleteFile,
    getSharedFile,
    keyExchangeDownload
};
