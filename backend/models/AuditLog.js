/**
 * Audit Log Model - Security Event Tracking
 * 
 * VIVA NOTE - Why Audit Logs?
 * 1. Compliance: Required by many security standards (SOC2, HIPAA)
 * 2. Forensics: Trace security incidents after they occur
 * 3. Accountability: Know who did what and when
 * 4. Deterrence: Users behave better when actions are logged
 */

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Who performed the action
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    actorUsername: {
        type: String,
        required: true
    },

    actorRole: {
        type: String,
        enum: ['admin', 'premium', 'guest', 'system'],
        required: true
    },

    // What action was performed
    action: {
        type: String,
        required: true,
        enum: [
            // Authentication events
            'LOGIN_SUCCESS',
            'LOGIN_FAILED',
            'LOGOUT',
            'MFA_SETUP',
            'MFA_VERIFIED',
            'MFA_FAILED',
            'PASSWORD_CHANGE',
            'ACCOUNT_LOCKED',

            // File events
            'FILE_UPLOAD',
            'FILE_DOWNLOAD',
            'FILE_DELETE',
            'FILE_SHARE',
            'FILE_UNSHARE',
            'KEY_EXCHANGE_DOWNLOAD',
            'INTEGRITY_CHECK_PASSED',
            'INTEGRITY_CHECK_FAILED',

            // Access control events
            'ACCESS_GRANTED',
            'ACCESS_DENIED',

            // Admin events
            'USER_CREATED',
            'USER_DELETED',
            'ROLE_CHANGED',
            'SYSTEM_CONFIG_CHANGED'
        ]
    },

    // What was the target of the action
    target: {
        type: String,  // Can be file ID, user ID, or resource name
        required: false
    },

    targetType: {
        type: String,
        enum: ['file', 'user', 'system', 'resource'],
        default: 'resource'
    },

    // Outcome of the action
    status: {
        type: String,
        enum: ['SUCCESS', 'FAILED', 'DENIED', 'ERROR'],
        required: true
    },

    // Additional context
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Client information
    ipAddress: {
        type: String,
        required: true
    },

    userAgent: {
        type: String
    },

    // Timestamps
    timestamp: {
        type: Date,
        default: Date.now,
        index: true  // Index for fast time-based queries
    }
}, {
    // Don't use default timestamps, we manage our own
    timestamps: false,

    // Optimize for high write volume
    capped: { size: 104857600, max: 100000 }  // 100MB cap, 100k documents max
});

// Indexes for efficient admin queries
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ status: 1, timestamp: -1 });
auditLogSchema.index({ target: 1 });

// Static method to log events easily
auditLogSchema.statics.log = async function (data) {
    try {
        return await this.create({
            actor: data.actorId,
            actorUsername: data.actorUsername || 'Unknown',
            actorRole: data.actorRole || 'guest',
            action: data.action,
            target: data.target,
            targetType: data.targetType || 'resource',
            status: data.status,
            details: data.details || {},
            ipAddress: data.ipAddress || 'Unknown',
            userAgent: data.userAgent
        });
    } catch (error) {
        console.error('Audit log error:', error);
        // Don't throw - logging should never break the main flow
    }
};

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
