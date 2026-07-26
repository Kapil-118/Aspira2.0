const AlumniProfile = require('../models/alumniProfile');
const ReferralRequest = require('../models/referralRequest');
const Notification = require('../models/notification');
const User = require('../models/user');

// @desc    Submit application to register as verified alumni
// @route   POST /api/alumni/apply
// @access  Private
const applyAlumni = async (req, res) => {
  const userId = req.user._id;
  const { 
    company, designation, experience, location, 
    linkedin, github, skills, biography, currentCTC, 
    openForMentorship, openForReferral 
  } = req.body;

  try {
    if (!company || !designation || !experience || !location) {
      return res.status(400).json({ success: false, message: 'Company, Designation, Experience, and Location are required.' });
    }

    // Check if user is already an alumni
    if (req.user.role === 'alumni') {
      return res.status(400).json({ success: false, message: 'You are already registered as an alumni.' });
    }

    const existing = await AlumniProfile.findOne({ userId });
    if (existing) {
      if (existing.isApproved) {
        return res.status(400).json({ success: false, message: 'You are already an approved alumni.' });
      } else {
        return res.status(400).json({ success: false, message: 'Your alumni verification is already pending admin review.' });
      }
    }

    const skillsArray = Array.isArray(skills) 
      ? skills 
      : (skills ? skills.split(',').map(s => s.trim()) : []);

    const profile = await AlumniProfile.create({
      userId,
      company,
      designation,
      experience: parseFloat(experience),
      location,
      linkedin,
      github,
      skills: skillsArray,
      biography,
      currentCTC: currentCTC ? parseFloat(currentCTC) : undefined,
      openForMentorship: openForMentorship !== false,
      openForReferral: openForReferral !== false,
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: 'Alumni verification application submitted successfully! Awaiting admin email verification.',
      profile
    });
  } catch (error) {
    console.error('Apply alumni profile error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get alumni directory with search filters
// @route   GET /api/alumni/directory
// @access  Private
const getAlumniDirectory = async (req, res) => {
  const { company, designation, location, skills, search } = req.query;

  try {
    let query = { isApproved: true };

    if (company) query.company = new RegExp(company, 'i');
    if (designation) query.designation = new RegExp(designation, 'i');
    if (location) query.location = new RegExp(location, 'i');
    if (skills) query.skills = { $in: [new RegExp(skills, 'i')] };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { company: searchRegex },
        { designation: searchRegex },
        { location: searchRegex },
        { skills: { $in: [searchRegex] } }
      ];
    }

    const directory = await AlumniProfile.find(query).populate('userId', 'name email profilePhoto role department');

    res.status(200).json({
      success: true,
      count: directory.length,
      directory
    });
  } catch (error) {
    console.error('Fetch alumni directory error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Submit referral request to alumni
// @route   POST /api/alumni/referral-request
// @access  Private
const submitReferralRequest = async (req, res) => {
  const studentId = req.user._id;
  const { alumniId, resumeLink, message } = req.body;

  try {
    if (!alumniId || !resumeLink) {
      return res.status(400).json({ success: false, message: 'Alumni User ID and Resume Link are required.' });
    }

    // Verify recipient is verified alumni
    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== 'alumni') {
      return res.status(404).json({ success: false, message: 'Target alumni user profile not found.' });
    }

    // Check for duplicate pending requests
    const existing = await ReferralRequest.findOne({ studentId, alumniId, status: 'Pending' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have a pending referral request already with this alumni.' });
    }

    const referral = await ReferralRequest.create({
      studentId,
      alumniId,
      resumeLink,
      message,
      status: 'Pending'
    });

    // Create Notification
    await Notification.create({
      recipient: alumniId,
      sender: studentId,
      type: 'request_sent',
      text: `${req.user.name} submitted a referral request for your review.`
    });

    res.status(201).json({
      success: true,
      message: 'Referral request sent successfully!',
      referral
    });
  } catch (error) {
    console.error('Submit referral request error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get referral requests list
// @route   GET /api/alumni/requests
// @access  Private
const getReferralRequests = async (req, res) => {
  const userId = req.user._id;

  try {
    let requests;
    if (req.user.role === 'alumni') {
      requests = await ReferralRequest.find({ alumniId: userId })
        .populate('studentId', 'name email profilePhoto department year')
        .sort({ createdAt: -1 });
    } else {
      requests = await ReferralRequest.find({ studentId: userId })
        .populate('alumniId', 'name email profilePhoto')
        .sort({ createdAt: -1 });
    }

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Fetch referral requests error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Accept/reject referral requests
// @route   PUT /api/alumni/referral-action/:id
// @access  Private
const handleReferralAction = async (req, res) => {
  const { id } = req.params; // referralId
  const { action } = req.body; // 'Approved' or 'Rejected'

  try {
    if (!['Approved', 'Rejected'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action type. Must be Approved or Rejected.' });
    }

    const referral = await ReferralRequest.findOne({ _id: id, alumniId: req.user._id });
    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral request profile not found.' });
    }

    referral.status = action;
    await referral.save();

    // Notify student
    await Notification.create({
      recipient: referral.studentId,
      sender: req.user._id,
      type: action === 'Approved' ? 'request_accepted' : 'request_rejected',
      text: `Your referral request has been ${action.toLowerCase()} by ${req.user.name}.`
    });

    res.status(200).json({
      success: true,
      message: `Referral request ${action.toLowerCase()} successfully!`,
      referral
    });
  } catch (error) {
    console.error('Handle referral action error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get alumni application status for current user
// @route   GET /api/alumni/application-status
// @access  Private
const getAlumniApplicationStatus = async (req, res) => {
  try {
    const profile = await AlumniProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(200).json({ success: true, status: 'none' });
    }
    res.status(200).json({
      success: true,
      status: profile.isApproved ? 'approved' : 'pending',
      alumniDetails: profile
    });
  } catch (error) {
    console.error('Fetch alumni application status error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  applyAlumni,
  getAlumniDirectory,
  submitReferralRequest,
  getReferralRequests,
  handleReferralAction,
  getAlumniApplicationStatus
};
