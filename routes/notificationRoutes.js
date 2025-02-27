// notification route for transactions

const express = require('express');
const { getNotifications, markNotificationAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

// Get all notifications for the logged-in user
router.get('/', getNotifications);

// Mark a notification as read
router.put('/:id/read', markNotificationAsRead);

module.exports = router;
