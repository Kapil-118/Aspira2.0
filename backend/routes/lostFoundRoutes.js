const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, getMyPosts, deletePost } = require('../controllers/lostFoundController');
const { protect, verifiedOnly } = require('../middlewares/auth');
const { handleImageUpload } = require('../middlewares/upload');

router.post('/create', protect, verifiedOnly, handleImageUpload('image'), createPost);
router.get('/all', protect, verifiedOnly, getAllPosts);
router.get('/my-posts', protect, verifiedOnly, getMyPosts);
router.delete('/delete/:id', protect, verifiedOnly, deletePost);

module.exports = router;
