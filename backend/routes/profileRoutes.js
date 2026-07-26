const express = require('express');
const router = express.Router();
const { updateProfile } = require('../controllers/profileController');
const { protect, verifiedOnly } = require('../middlewares/auth');
const { handleImageUpload } = require('../middlewares/upload');

router.put('/update', protect, verifiedOnly, handleImageUpload('profilePhoto'), updateProfile);

module.exports = router;
