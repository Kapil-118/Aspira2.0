const express = require('express');
const router = express.Router();
const { 
  getPendingMentors, approveMentor, rejectMentor,
  getPendingAlumni, approveAlumni, rejectAlumni 
} = require('../controllers/adminController');
const { protect, verifiedOnly, restrictTo } = require('../middlewares/auth');

router.use(protect);
router.use(verifiedOnly);
router.use(restrictTo('admin'));

router.get('/pending-mentors', getPendingMentors);
router.put('/approve-mentor/:id', approveMentor);
router.delete('/reject-mentor/:id', rejectMentor);

router.get('/pending-alumni', getPendingAlumni);
router.put('/approve-alumni/:id', approveAlumni);
router.delete('/reject-alumni/:id', rejectAlumni);

module.exports = router;
