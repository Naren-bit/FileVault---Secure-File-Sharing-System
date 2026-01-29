/**
 * Access Control List (ACL) Middleware
 * 
 * ============================================================
 * VIVA NOTE - Access Control Matrix
 * ============================================================
 * 
 * Subjects (Users):
 * - admin: Full system access
 * - premium: Can manage own encrypted files
 * - guest: Read-only access to public content
 * 
 * Objects (Resources):
 * - System Logs: Admin only
 * - Encrypted Vault: Admin + Premium
 * - Public Repository: Everyone
 * 
 * Access Matrix:
 * 
 * |          | System Logs | Encrypted Vault | Public Repo |
 * |----------|-------------|-----------------|-------------|
 * | Admin    | ✅ CRUD     | ✅ CRUD         | ✅ CRUD     |
 * | Premium  | ❌          | ✅ Own files    | ✅ Read     |
 * | Guest    | ❌          | ❌              | ✅ Read     |
 * 
 * Implementation: Role-based with resource-level granularity
 * 
 * ============================================================
 */

const AuditLog = require('../models/AuditLog');
const { getClientIP } = require('./authMiddleware');

// Define the ACL rules
const ACL_RULES = {
    // System Logs - Admin only
    'system-logs': {
        read: ['admin'],
        write: ['admin'],
        delete: ['admin']
    },

    // Encrypted Vault - Admin and Premium
    'encrypted-vault': {
        read: ['admin', 'premium'],
        write: ['admin', 'premium'],
        delete: ['admin', 'premium']
    },

    // Public Repository - All can read, Admin/Premium can write
    'public-repository': {
        read: ['admin', 'premium', 'guest'],
        write: ['admin', 'premium'],
        delete: ['admin']
    },

    // User Management - Admin only
    'user-management': {
        read: ['admin'],
        write: ['admin'],
        delete: ['admin']
    },

    // Own Profile - All authenticated users
    'own-profile': {
        read: ['admin', 'premium', 'guest'],
        write: ['admin', 'premium', 'guest'],
        delete: []  // Cannot self-delete
    }
};

/**
 * Verify if user has required role for the action
 * 
 * @param {string[]} allowedRoles - Roles that can perform this action
 * @returns {Function} Express middleware function
 * 
 * Usage:
 * router.get('/admin/logs', verifyRole(['admin']), getSystemLogs);
 * router.post('/vault/upload', verifyRole(['admin', 'premium']), uploadFile);
 */
const verifyRole = (allowedRoles) => {
    return async (req, res, next) => {
        try {
            // User must be authenticated first
            if (!req.user) {
                await logDeniedAccess(req, 'No user session', 'UNAUTHORIZED');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const userRole = req.user.role;

            // Check if user's role is in allowed roles
            if (!allowedRoles.includes(userRole)) {
                // Log the denied access attempt
                await logDeniedAccess(req, `Role ${userRole} not in ${allowedRoles}`, 'FORBIDDEN');

                /**
                 * VIVA NOTE - Generic Error Messages:
                 * We return the same message for all denials.
                 * This prevents attackers from learning:
                 * 1. Which roles exist
                 * 2. Which endpoints require which roles
                 */
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action.'
                });
            }

            // Role check passed
            next();
        } catch (error) {
            console.error('ACL middleware error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error.'
            });
        }
    };
};

/**
 * Verify access to a specific resource with action type
 * More granular than verifyRole
 * 
 * @param {string} resource - Resource name from ACL_RULES
 * @param {string} action - 'read', 'write', or 'delete'
 */
const verifyResourceAccess = (resource, action) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                await logDeniedAccess(req, `Unauthenticated access to ${resource}`, 'UNAUTHORIZED');
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            const rules = ACL_RULES[resource];

            if (!rules) {
                console.error(`Unknown resource: ${resource}`);
                return res.status(500).json({
                    success: false,
                    message: 'Configuration error.'
                });
            }

            const allowedRoles = rules[action] || [];

            if (!allowedRoles.includes(req.user.role)) {
                await logDeniedAccess(req, `${action} on ${resource}`, 'FORBIDDEN');

                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to perform this action.'
                });
            }

            next();
        } catch (error) {
            console.error('Resource ACL error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error.'
            });
        }
    };
};

/**
 * Verify user owns the resource or is admin
 * Used for file-level access control
 */
const verifyOwnership = (getOwnerId) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required.'
                });
            }

            // Admins can access anything
            if (req.user.role === 'admin') {
                return next();
            }

            // Get the owner ID using the provided function
            const ownerId = await getOwnerId(req);

            if (!ownerId) {
                return res.status(404).json({
                    success: false,
                    message: 'Resource not found.'
                });
            }

            // Check if current user is the owner
            if (req.user._id.toString() !== ownerId.toString()) {
                await logDeniedAccess(req, 'Not owner of resource', 'FORBIDDEN');

                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to access this resource.'
                });
            }

            next();
        } catch (error) {
            console.error('Ownership check error:', error);
            res.status(500).json({
                success: false,
                message: 'Authorization error.'
            });
        }
    };
};

/**
 * Log denied access attempts to audit log
 * Essential for security monitoring and forensics
 */
async function logDeniedAccess(req, reason, status) {
    try {
        await AuditLog.log({
            actorId: req.user?._id || null,
            actorUsername: req.user?.username || 'Anonymous',
            actorRole: req.user?.role || 'none',
            action: 'ACCESS_DENIED',
            target: req.originalUrl,
            targetType: 'resource',
            status: 'DENIED',
            details: {
                reason,
                method: req.method,
                body: req.body ? Object.keys(req.body) : []
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });
    } catch (error) {
        console.error('Failed to log denied access:', error);
    }
}

module.exports = {
    verifyRole,
    verifyResourceAccess,
    verifyOwnership,
    ACL_RULES
};
