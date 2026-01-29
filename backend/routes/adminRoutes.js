/**
 * Admin Routes
 */

const express = require('express');
const router = express.Router();
const {
    getSystemStats,
    getAuditLogs,
    getUsers,
    updateUserRole,
    unlockUser
} = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { verifyRole, verifyResourceAccess } = require('../middleware/aclMiddleware');

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(verifyRole(['admin']));

// System statistics
router.get('/stats', getSystemStats);

// Audit logs (system-logs resource)
router.get(
    '/logs',
    verifyResourceAccess('system-logs', 'read'),
    getAuditLogs
);

// User management
router.get(
    '/users',
    verifyResourceAccess('user-management', 'read'),
    getUsers
);

router.put(
    '/users/:id/role',
    verifyResourceAccess('user-management', 'write'),
    updateUserRole
);

router.post(
    '/users/:id/unlock',
    verifyResourceAccess('user-management', 'write'),
    unlockUser
);

module.exports = router;
