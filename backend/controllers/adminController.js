/**
 * Admin Controller
 * 
 * Handles: System stats, Audit logs, User management
 * Admin-only endpoints for system monitoring and control
 */

const User = require('../models/User');
const File = require('../models/File');
const AuditLog = require('../models/AuditLog');
const { getClientIP } = require('../middleware/authMiddleware');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get system statistics
 * GET /api/admin/stats
 */
const getSystemStats = async (req, res) => {
    try {
        // User statistics
        const totalUsers = await User.countDocuments();
        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const mfaStats = await User.aggregate([
            {
                $group: {
                    _id: '$mfaVerified',
                    count: { $sum: 1 }
                }
            }
        ]);

        // File statistics
        const totalFiles = await File.countDocuments();
        const filesByAccess = await File.aggregate([
            { $group: { _id: '$accessLevel', count: { $sum: 1 } } }
        ]);

        const totalSize = await File.aggregate([
            { $group: { _id: null, total: { $sum: '$size' } } }
        ]);

        const totalDownloads = await File.aggregate([
            { $group: { _id: null, total: { $sum: '$downloadCount' } } }
        ]);

        // Activity statistics (last 24 hours)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const recentActivity = await AuditLog.aggregate([
            { $match: { timestamp: { $gte: last24h } } },
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const loginAttempts = await AuditLog.countDocuments({
            action: { $in: ['LOGIN_SUCCESS', 'LOGIN_FAILED'] },
            timestamp: { $gte: last24h }
        });

        const failedLogins = await AuditLog.countDocuments({
            action: 'LOGIN_FAILED',
            timestamp: { $gte: last24h }
        });

        const accessDenied = await AuditLog.countDocuments({
            action: 'ACCESS_DENIED',
            timestamp: { $gte: last24h }
        });

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: totalUsers,
                    byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
                    mfaEnabled: mfaStats.find(s => s._id === true)?.count || 0,
                    mfaPending: mfaStats.find(s => s._id === false)?.count || 0
                },
                files: {
                    total: totalFiles,
                    byAccess: filesByAccess.reduce((acc, f) => ({ ...acc, [f._id]: f.count }), {}),
                    totalSize: totalSize[0]?.total || 0,
                    totalDownloads: totalDownloads[0]?.total || 0
                },
                security: {
                    loginAttempts24h: loginAttempts,
                    failedLogins24h: failedLogins,
                    accessDenied24h: accessDenied,
                    securityScore: calculateSecurityScore(failedLogins, accessDenied, totalUsers)
                },
                activity: recentActivity
            }
        });

    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system statistics.'
        });
    }
};

/**
 * Calculate a simple security score (0-100)
 */
function calculateSecurityScore(failedLogins, accessDenied, totalUsers) {
    // Base score starts at 100
    let score = 100;

    // Deduct points for failed logins (max -30)
    const failedRatio = failedLogins / Math.max(totalUsers, 1);
    score -= Math.min(failedRatio * 100, 30);

    // Deduct points for access denied (max -20)
    score -= Math.min(accessDenied * 2, 20);

    return Math.max(Math.round(score), 0);
}

/**
 * Get audit logs
 * GET /api/admin/logs
 */
const getAuditLogs = async (req, res) => {
    try {
        const {
            action,
            status,
            actor,
            startDate,
            endDate,
            page = 1,
            limit = 50
        } = req.query;

        let query = {};

        if (action) query.action = action;
        if (status) query.status = status;
        if (actor) query.actorUsername = new RegExp(actor, 'i');

        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }

        const logs = await AuditLog.find(query)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await AuditLog.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                logs: logs.map(log => ({
                    id: log._id,
                    timestamp: log.timestamp,
                    actor: log.actorUsername,
                    actorRole: log.actorRole,
                    action: log.action,
                    target: log.target,
                    targetType: log.targetType,
                    status: log.status,
                    ipAddress: log.ipAddress,
                    details: log.details
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
        console.error('Audit log error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit logs.'
        });
    }
};

/**
 * Get all users (admin only)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
    try {
        const { role, page = 1, limit = 20 } = req.query;

        let query = {};
        if (role) query.role = role;

        const users = await User.find(query)
            .select('-password -mfaSecret -encryptionSalt')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                users: users.map(u => ({
                    id: u._id,
                    username: u.username,
                    email: u.email,
                    role: u.role,
                    mfaEnabled: u.mfaEnabled,
                    mfaVerified: u.mfaVerified,
                    lastLogin: u.lastLogin,
                    loginAttempts: u.loginAttempts,
                    isLocked: u.isLocked ? u.isLocked() : false,
                    createdAt: u.createdAt
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
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users.'
        });
    }
};

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['admin', 'premium', 'guest'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified.'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'ROLE_CHANGED',
            target: user._id.toString(),
            targetType: 'user',
            status: 'SUCCESS',
            details: {
                username: user.username,
                oldRole,
                newRole: role
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'User role updated successfully.',
            data: {
                userId: user._id,
                username: user.username,
                oldRole,
                newRole: role
            }
        });

    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role.'
        });
    }
};

/**
 * Unlock a user account
 * POST /api/admin/users/:id/unlock
 */
const unlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();

        await AuditLog.log({
            actorId: req.user._id,
            actorUsername: req.user.username,
            actorRole: req.user.role,
            action: 'ACCOUNT_LOCKED',
            target: user._id.toString(),
            targetType: 'user',
            status: 'SUCCESS',
            details: {
                action: 'unlocked',
                username: user.username
            },
            ipAddress: getClientIP(req),
            userAgent: req.headers['user-agent']
        });

        res.status(200).json({
            success: true,
            message: 'User account unlocked successfully.'
        });

    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to unlock user account.'
        });
    }
};

module.exports = {
    getSystemStats,
    getAuditLogs,
    getUsers,
    updateUserRole,
    unlockUser
};
