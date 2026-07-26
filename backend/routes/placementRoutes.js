const express = require('express');
const router = express.Router();
const { 
  getApplications, 
  createApplication, 
  updateApplication, 
  deleteApplication, 
  getDashboardData 
} = require('../controllers/placementController');
const { protect, verifiedOnly, eligibleForPlacementOnly } = require('../middlewares/auth');

router.get('/all', protect, verifiedOnly, eligibleForPlacementOnly, getApplications);
router.get('/dashboard', protect, verifiedOnly, eligibleForPlacementOnly, getDashboardData);
router.post('/create', protect, verifiedOnly, eligibleForPlacementOnly, createApplication);
router.put('/update/:id', protect, verifiedOnly, eligibleForPlacementOnly, updateApplication);
router.delete('/delete/:id', protect, verifiedOnly, eligibleForPlacementOnly, deleteApplication);

module.exports = router;
