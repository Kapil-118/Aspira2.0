const express = require('express');
const router = express.Router();
const { getConversations, getMessages, sendMessage, markMessagesSeen, uploadFile } = require('../controllers/chatController');
const { protect, verifiedOnly } = require('../middlewares/auth');

const { handleImageUpload } = require('../middlewares/upload');

router.get('/conversations', protect, verifiedOnly, getConversations);
router.get('/messages/:conversationId', protect, verifiedOnly, getMessages);
router.post('/send', protect, verifiedOnly, handleImageUpload('chatFile'), sendMessage);
router.post('/upload', protect, verifiedOnly, handleImageUpload('chatFile'), uploadFile);
router.put('/messages-seen/:conversationId', protect, verifiedOnly, markMessagesSeen);

module.exports = router;
