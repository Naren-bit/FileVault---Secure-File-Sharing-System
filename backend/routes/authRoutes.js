/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const {
    register,
    login,
    verifyMFA,
    getMe,
    logout,
    getPublicKey
} = require('../controllers/authController');
const { verifyToken, verifyMFAToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// MFA verification (requires MFA token from login)
router.post('/verify-mfa', verifyMFAToken, verifyMFA);

// Key Exchange - Get user's public key (requires authentication)
router.get('/public-key/:userId', verifyToken, getPublicKey);

// Protected routes (requires full authentication)
router.get('/me', verifyToken, getMe);
router.post('/logout', verifyToken, logout);

module.exports = router;

