const express = require('express');
const router = express.Router();
const { 
  startSession, 
  submitAnswer, 
  getHistory, 
  getLeaderboard 
} = require('../controllers/interviewController');
const { protect, verifiedOnly, eligibleForPlacementOnly } = require('../middlewares/auth');

router.post('/start', protect, verifiedOnly, eligibleForPlacementOnly, startSession);
router.post('/submit-answer', protect, verifiedOnly, eligibleForPlacementOnly, submitAnswer);
router.get('/history', protect, verifiedOnly, eligibleForPlacementOnly, getHistory);
router.get('/leaderboard', protect, verifiedOnly, eligibleForPlacementOnly, getLeaderboard);

module.exports = router;
