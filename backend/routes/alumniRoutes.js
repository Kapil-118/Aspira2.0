const express = require('express');
const router = express.Router();
const {
  applyAlumni,
  getAlumniDirectory,
  submitReferralRequest,
  getReferralRequests,
  handleReferralAction,
  getAlumniApplicationStatus
} = require('../controllers/alumniController');
const { protect, verifiedOnly } = require('../middlewares/auth');

router.post('/apply', protect, verifiedOnly, applyAlumni);
router.get('/directory', protect, verifiedOnly, getAlumniDirectory);
router.post('/referral-request', protect, verifiedOnly, submitReferralRequest);
router.get('/requests', protect, verifiedOnly, getReferralRequests);
router.put('/referral-action/:id', protect, verifiedOnly, handleReferralAction);
router.get('/application-status', protect, verifiedOnly, getAlumniApplicationStatus);

module.exports = router;
