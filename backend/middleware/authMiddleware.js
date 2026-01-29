/**
 * Authentication Middleware - JWT Verification
 * 
 * ============================================================
 * VIVA NOTE - Why httpOnly Cookies for JWT?
 * ============================================================
 * 
 * Traditional approach: Store JWT in localStorage
 * Our approach: Store JWT in httpOnly cookie
 * 
 * Why httpOnly cookies are more secure:
 * 
 * 1. XSS Protection:
 *    - localStorage is accessible via JavaScript
 *    - XSS attack can steal tokens: localStorage.getItem('token')
 *    - httpOnly cookies CANNOT be accessed by JavaScript
 *    - Even if XSS occurs, attacker can't steal the token
 *    
 * 2. Automatic Transmission:
 *    - Cookies are sent automatically with every request
 *    - No need for client-side token management
 *    - Less chance of implementation errors
 *    
 * 3. CSRF Protection:
 *    - We use SameSite=Strict to prevent CSRF
 *    - Cookie only sent for same-site requests
 *    
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

/**
 * Verify JWT token from httpOnly cookie
 * Attaches user object to req.user if valid
 */
const verifyToken = async (req, res, next) => {
    try {
        // Get token from httpOnly cookie
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if MFA is required but not verified
        if (decoded.mfaPending) {
            return res.status(403).json({
                success: false,
                message: 'MFA verification required.',
                mfaRequired: true
            });
        }

        // Fetch user from database
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found. Token invalid.'
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked. Try again later.'
            });
        }

        // Attach user to request object
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.'
            });
        }

        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 * Used for public routes that behave differently for logged-in users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded.mfaPending) {
                const user = await User.findById(decoded.id).select('-password');
                if (user && !user.isLocked()) {
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {
        // Token invalid or expired - continue as unauthenticated
        next();
    }
};

/**
 * Verify MFA pending token
 * Used during the MFA verification step
 */
const verifyMFAToken = async (req, res, next) => {
    try {
        const token = req.cookies.mfaToken;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'MFA session expired. Please login again.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.mfaPending) {
            return res.status(400).json({
                success: false,
                message: 'Invalid MFA token.'
            });
        }

        const user = await User.findById(decoded.id).select('+mfaSecret');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        req.user = user;
        req.mfaToken = token;

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'MFA session expired. Please login again.'
            });
        }

        res.status(401).json({
            success: false,
            message: 'Invalid MFA session.'
        });
    }
};

/**
 * Get client IP address (handles proxies)
 */
const getClientIP = (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'Unknown';
};

module.exports = {
    verifyToken,
    optionalAuth,
    verifyMFAToken,
    getClientIP
};
