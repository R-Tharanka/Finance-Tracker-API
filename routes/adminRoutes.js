const express = require('express');
const { getAllUsers, deleteUser, updateUserRole, getAdminReports } = require('../controllers/adminController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);
router.use(authorize(['admin']));  // Admin-only routes

// Manage users
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/role', updateUserRole);
router.get('/reports', getAdminReports);

module.exports = router;
