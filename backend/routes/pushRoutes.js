const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe, getPublicKey } = require('../controllers/pushController');
const { protect, verifiedOnly } = require('../middlewares/auth');

router.post('/subscribe', protect, verifiedOnly, subscribe);
router.post('/unsubscribe', protect, verifiedOnly, unsubscribe);
router.get('/vapid-public-key', protect, verifiedOnly, getPublicKey);

module.exports = router;
