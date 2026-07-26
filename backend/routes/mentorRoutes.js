const express = require('express');
const router = express.Router();
const { getAllMentors, getMentorById, searchMentors, applyMentor, getApplicationStatus } = require('../controllers/mentorController');
const { protect, verifiedOnly } = require('../middlewares/auth');

router.get('/all', protect, verifiedOnly, getAllMentors);
router.get('/search', protect, verifiedOnly, searchMentors);
router.post('/apply', protect, verifiedOnly, applyMentor);
router.get('/application-status', protect, verifiedOnly, getApplicationStatus);
router.get('/:id', protect, verifiedOnly, getMentorById);

module.exports = router;
