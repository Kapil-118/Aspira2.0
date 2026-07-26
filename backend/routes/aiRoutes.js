const express = require('express');
const router = express.Router();
const { analyzeResumeController, chatbotController } = require('../controllers/aiController');
const { protect, verifiedOnly } = require('../middlewares/auth');
const { multerUpload } = require('../middlewares/upload');

// Single PDF file upload mapping
router.post('/resume-analyze', protect, verifiedOnly, multerUpload.single('resume'), analyzeResumeController);
router.post('/chatbot', protect, verifiedOnly, chatbotController);

module.exports = router;
