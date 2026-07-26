const express = require('express');
const router = express.Router();
const { createEvent, getAllEvents, registerForEvent } = require('../controllers/eventController');
const { protect, verifiedOnly, restrictTo } = require('../middlewares/auth');

router.post('/create', protect, verifiedOnly, restrictTo('mentor'), createEvent);
router.get('/all', protect, verifiedOnly, getAllEvents);
router.post('/register/:id', protect, verifiedOnly, registerForEvent);

module.exports = router;
