/**
 * Authentication Controller
 * 
 * Handles: Registration, Login, MFA Setup, MFA Verification, Logout
 * 
 * ============================================================
 * VIVA NOTE - NIST SP 800-63-2 Compliance
 * ============================================================
 * 
 * Key requirements implemented:
 * 
 * 1. Multi-Factor Authentication (MFA):
 *    - Something you KNOW (password)
 *    - Something you HAVE (TOTP via Google Authenticator)
 *    
 * 2. Secure Session Management:
 *    - httpOnly cookies (not accessible via JavaScript)
 *    - Secure flag in production (HTTPS only)
 *    - SameSite=Strict (prevents CSRF)
 *    
 * 3. Account Lockout:
 *    - 5 failed attempts = 2 hour lockout
 *    - Prevents brute force attacks
 *    
 * 4. Generic Error Messages:
 *    - "Invalid credentials" - doesn't reveal if user exists
 *    - Prevents username enumeration attacks
 * 
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { generateSalt } = require('../utils/keyDerivation');
const { generateMFAQRCode } = require('../utils/qrGenerator');
const { getClientIP } = require('../middleware/authMiddleware');
const { generateKeyPair } = require('../utils/keyExchange');

// Cookie configuration
const getCookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: maxAge
});

/**
 * Register a new user
 * POST /api/auth/register
 */
const register = async (req, res) => {
    try {
        const { username, email, password, role = 'guest' } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide username, email, and password.'
            });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists.'
            });
        }

        /**
         * VIVA NOTE - TOTP Secret Generation:
         * speakeasy generates a random base32 secret.
         * Base32 encoding is used because:
         * 1. Case-insensitive (easier to manually enter)
         * 2. No ambiguous characters (0/O, 1/l)
         * 3. Standard for authenticator apps (RFC 6238)
         */
        const mfaSecret = speakeasy.generateSecret({
            name: `SecureFileShare:${email}`,
            length: 20  // 160 bits of entropy
        });

        // Generate salt for key derivation
        const encryptionSalt = generateSalt();

        /**
         * VIVA NOTE - RSA Key Pair Generation:
         * Generate a unique RSA key pair for this user.
         * Used for secure key exchange when sharing files (optional).
         * The private key is NEVER exposed to clients.
         */
        const ecdhKeyPair = generateKeyPair();

        /**
         * VIVA NOTE - Single Admin Policy:
         * Only ONE admin account can exist in the system.
         * This is a security measure to prevent privilege escalation.
         * If someone tries to create another admin, they're downgraded to 'guest'.
         */
        let allowedRole = ['admin', 'premium', 'guest'].includes(role) ? role : 'guest';

        if (allowedRole === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (existingAdmin) {
                return res.status(400).json({
                    success: false,
                    message: 'Admin account already exists. Only one admin is allowed.'
                });
            }
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,  // Will be hashed by pre-save hook
            role: allowedRole,
            mfaSecret: mfaSecret.base32,
            mfaEnabled: true,  // MFA is mandatory
            mfaVerified: false,
            encryptionSalt,
            ecdhPublicKey: ecdhKeyPair.publicKey,
            ecdhPrivateKey: ecdhKeyPair.privateKey
        });

        // Generate QR code for MFA setup
        const qrCode = await generateMFAQRCode(mfaSecret.base32, email);

        // Log registration
        await AuditLog.log({
            actorId: user._id,
            actorUsername: user.username,
            actorRole: user.role,
            action: 'USER_CREATED',
            target: user._id.toString(),
            targetType: 'user',
            status: 'SUCCESS',
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please set up MFA.',
            data: {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                mfa: {
                    qrCode,
                    secret: mfaSecret.base32,  // Also provide plain text for manual entry
                    setupRequired: true
                }
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed. Please try again.'
        });
    }
};

/**
 * Login - Step 1: Verify password
 * POST /api/auth/login
 * 
 * Returns MFA token for second factor verification
 */
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password.'
            });
        }

        // Find user with password field
        const user = await User.findOne({ email }).select('+password');

        /**
         * VIVA NOTE - Timing Attack Prevention:
         * We always run password comparison even if user doesn't exist.
         * This prevents timing attacks that could determine if email exists.
         */
        if (!user) {
            // Fake hash comparison to maintain consistent timing
            await require('bcryptjs').compare(password, '$2a$12$dummy.hash.to.prevent.timing.attacks');

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'  // Generic message
            });
        }

        // Check if account is locked
        if (user.isLocked()) {
            await AuditLog.log({
                actorId: user._id,
                actorUsername: user.username,
                actorRole: user.role,
                action: 'LOGIN_FAILED',
                target: user._id.toString(),
                targetType: 'user',
                status: 'DENIED',
                details: { reason: 'Account locked' },
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent']
            });

            return res.status(423).json({
                success: false,
                message: 'Account is temporarily locked. Try again later.'
            });
        }

        // Verify password
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            // Increment failed attempts
            await user.incrementLoginAttempts();

            await AuditLog.log({
                actorId: user._id,
                actorUsername: user.username,
                actorRole: user.role,
                action: 'LOGIN_FAILED',
                target: user._id.toString(),
                targetType: 'user',
                status: 'FAILED',
                details: { reason: 'Invalid password' },
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent']
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'  // Same message for security
            });
        }

        // Password correct - issue MFA pending token
        const mfaToken = jwt.sign(
            {
                id: user._id,
                mfaPending: true
            },
            process.env.JWT_SECRET,
            { expiresIn: '5m' }  // 5 minutes to complete MFA
        );

        // Set MFA token in httpOnly cookie
        res.cookie('mfaToken', mfaToken, getCookieOptions(5 * 60 * 1000));

        res.status(200).json({
            success: true,
            message: 'Password verified. Please enter MFA code.',
            data: {
                mfaRequired: true,
                userId: user._id
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
};

/**
 * Verify MFA - Step 2: Verify TOTP code
 * POST /api/auth/verify-mfa
 */
const verifyMFA = async (req, res) => {
    try {
        const { token } = req.body;
        const user = req.user;  // Set by verifyMFAToken middleware

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Please provide MFA token.'
            });
        }

        /**
         * VIVA NOTE - TOTP Verification:
         * speakeasy.totp.verify() checks if the code is valid.
         * window: 1 allows codes from 30 seconds before/after.
         * This handles clock drift between server and phone.
         */
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: token,
            window: 1  // Allow 1 step tolerance (30 seconds each way)
        });

        if (!verified) {
            await AuditLog.log({
                actorId: user._id,
                actorUsername: user.username,
                actorRole: user.role,
                action: 'MFA_FAILED',
                target: user._id.toString(),
                targetType: 'user',
                status: 'FAILED',
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent']
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid MFA code. Please try again.'
            });
        }

        // MFA verified - update user if first time
        if (!user.mfaVerified) {
            user.mfaVerified = true;
            await user.save();

            await AuditLog.log({
                actorId: user._id,
                actorUsername: user.username,
                actorRole: user.role,
                action: 'MFA_SETUP',
                target: user._id.toString(),
                targetType: 'user',
                status: 'SUCCESS',
                ipAddress: getClientIP(req),
                userAgent: req.headers['user-agent']
            });
        }

        // Reset login attempts on successful login
        if (user.loginAttempts > 0) {
            user.loginAttempts = 0;
            user.lockUntil = undefined;
        }
        user.lastLogin = new Date();
        await user.save();

        // Issue full access token
        const accessToken = jwt.sign(
            {
                id: user._id,
                role: user.role,
                mfaPending: false
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
        );

        // Clear MFA token, set access token
        res.clearCookie('mfaToken');
        res.cookie('accessToken', accessToken, getCookieOptions(24 * 60 * 60 * 1000));

        await AuditLog.log({
            actorId: user._id,
            actorUsername: user.username,
            actorRole: user.role,
            action: 'LOGIN_SUCCESS',
            target: user._id.toString(),
            targetType: 'user',
            status: 'SUCCESS',
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    mfaEnabled: user.mfaEnabled
                }
            }
        });

    } catch (error) {
        console.error('MFA verification error:', error);
        res.status(500).json({
            success: false,
            message: 'MFA verification failed. Please try again.'
        });
    }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            data: {
                user: {
                    id: req.user._id,
                    username: req.user.username,
                    email: req.user.email,
                    role: req.user.role,
                    mfaEnabled: req.user.mfaEnabled,
                    createdAt: req.user.createdAt,
                    lastLogin: req.user.lastLogin
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile.'
        });
    }
};

/**
 * Logout - Clear session
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
    try {
        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'LOGOUT',
            target: req.user._id.toString(),
            targetType: 'user',
            status: 'SUCCESS',
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        // Clear all auth cookies
        res.clearCookie('accessToken');
        res.clearCookie('mfaToken');

        res.status(200).json({
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Logout failed.'
        });
    }
};

/**
 * Get user's public key for key exchange
 * GET /api/auth/public-key/:userId
 * 
 * VIVA NOTE - Key Exchange Public Key:
 * This returns the user's RSA public key, which can be safely shared.
 * For the RSA approach, guests generate their own keys per-download.
 * The private key is NEVER exposed.
 */
const getPublicKey = async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).select('username ecdhPublicKey');

        if (!user || !user.ecdhPublicKey) {
            return res.status(404).json({
                success: false,
                message: 'User public key not found.'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                userId: user._id,
                username: user.username,
                publicKey: user.ecdhPublicKey
            }
        });
    } catch (error) {
        console.error('Get public key error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public key.'
        });
    }
};

module.exports = {
    register,
    login,
    verifyMFA,
    getMe,
    logout,
    getPublicKey
};
