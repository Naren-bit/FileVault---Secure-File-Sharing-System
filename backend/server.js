/**
 * Secure File Sharing System - Main Server
 * 
 * ============================================================
 * VIVA NOTE - Security Middleware Stack
 * ============================================================
 * 
 * 1. Helmet: Sets security HTTP headers
 *    - X-Content-Type-Options: nosniff
 *    - X-Frame-Options: DENY
 *    - X-XSS-Protection: 1; mode=block
 *    - Strict-Transport-Security (HTTPS)
 *    
 * 2. Rate Limiting: Prevents brute force attacks
 *    - 100 requests per 15 minutes per IP
 *    - Separate stricter limit on auth routes
 *    
 * 3. CORS: Controls cross-origin access
 *    - Only allows frontend origin
 *    - Credentials enabled for cookies
 *    
 * 4. Cookie Parser: Handles httpOnly cookies
 *    - Extracts JWT for authentication
 * 
 * ============================================================
 */

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// ============ SECURITY MIDDLEWARE ============

/**
 * Helmet - Security HTTP headers
 * VIVA: Prevents common web vulnerabilities
 */
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

/**
 * CORS Configuration
 * VIVA: Only allows requests from our frontend
 */
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,  // Required for cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Encryption-Password']
}));

/**
 * Rate Limiting - General API
 * VIVA: Prevents DoS attacks
 * NOTE: Higher limits for development, reduce in production
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 500,  // More lenient in dev
    message: {
        success: false,
        message: 'Too many requests. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Rate Limiting - Auth routes (stricter)
 * VIVA: Prevents brute force login attacks
 * NOTE: Higher limits for development, reduce in production
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 20 : 100,  // 100 in dev, 20 in prod
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

app.use(generalLimiter);

// ============ BODY PARSERS ============

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ============ ROUTES ============

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Secure File Sharing System API is running',
        timestamp: new Date().toISOString(),
        security: {
            helmet: true,
            cors: true,
            rateLimiting: true,
            mfaEnforced: true
        }
    });
});

// Auth routes with stricter rate limit
app.use('/api/auth', authLimiter, authRoutes);

// File routes
app.use('/api/files', fileRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ============ ERROR HANDLING ============

/**
 * 404 Handler
 * VIVA: Generic message to prevent info leakage
 */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Resource not found.'
    });
});

/**
 * Global Error Handler
 * VIVA: Never expose stack traces in production
 */
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    // Don't leak error details in production
    const message = process.env.NODE_ENV === 'production'
        ? 'Internal server error.'
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message
    });
});

// ============ SERVER STARTUP ============

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();

        // Start server
        app.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🔐 SECURE FILE SHARING SYSTEM                          ║
║                                                          ║
║   Server running on port ${PORT}                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                           ║
║                                                          ║
║   Security Features:                                     ║
║   ✅ Helmet (Security Headers)                           ║
║   ✅ CORS (Cross-Origin Protection)                      ║
║   ✅ Rate Limiting (Brute Force Protection)              ║
║   ✅ httpOnly Cookies (XSS Protection)                   ║
║   ✅ MFA Enforced (TOTP/Google Authenticator)            ║
║   ✅ AES-256-GCM Encryption                              ║
║   ✅ bcrypt Password Hashing                             ║
║   ✅ SHA-256 File Integrity                              ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
