const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { protect, verifiedOnly } = require('../middlewares/auth');

router.get('/', protect, verifiedOnly, getNotifications);
router.put('/read', protect, verifiedOnly, markAsRead);

module.exports = router;
