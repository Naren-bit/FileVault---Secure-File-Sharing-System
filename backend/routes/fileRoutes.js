/**
 * File Routes
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
    uploadFile,
    downloadFile,
    getFiles,
    shareFile,
    deleteFile,
    getSharedFile,
    keyExchangeDownload
} = require('../controllers/fileController');
const { verifyToken, optionalAuth } = require('../middleware/authMiddleware');
const { verifyRole, verifyResourceAccess } = require('../middleware/aclMiddleware');

// Configure multer for memory storage (we encrypt before saving)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024  // 50MB limit
    }
});

// Public shared file access
router.get('/share/:token', getSharedFile);

// Protected routes
router.use(verifyToken);  // All routes below require authentication

// Get all files (filtered by access level based on role)
router.get('/', getFiles);

// Upload file (premium and admin only)
router.post(
    '/upload',
    verifyRole(['admin', 'premium']),
    upload.single('file'),
    uploadFile
);

// Download file (all authenticated users, but access checked in controller)
router.post('/:id/download', downloadFile);

// Key Exchange Download (RSA-based secure download)
router.post('/:id/key-exchange', keyExchangeDownload);

// Share file via QR code
router.post(
    '/:id/share',
    verifyRole(['admin', 'premium']),
    shareFile
);

// Delete file
router.delete(
    '/:id',
    verifyRole(['admin', 'premium']),
    deleteFile
);

module.exports = router;

