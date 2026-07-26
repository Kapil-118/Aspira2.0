const express = require('express');
const router = express.Router();
const { sendRequest, acceptRequest, rejectRequest, getMyRequests, getMyConnections } = require('../controllers/connectionController');
const { protect, verifiedOnly, restrictTo } = require('../middlewares/auth');

router.post('/send/:mentorId', protect, verifiedOnly, sendRequest);
router.put('/accept/:id', protect, verifiedOnly, restrictTo('mentor'), acceptRequest);
router.put('/reject/:id', protect, verifiedOnly, restrictTo('mentor'), rejectRequest);
router.get('/my-requests', protect, verifiedOnly, getMyRequests);
router.get('/my-connections', protect, verifiedOnly, getMyConnections);

module.exports = router;
