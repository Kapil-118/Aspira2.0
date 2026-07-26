const Mentor = require('../models/mentor');
const User = require('../models/user');

// @desc    Get all mentors with filter/query options
// @route   GET /api/mentor/all
// @access  Private (or Public, but Private protected in router makes sense for security)
const getAllMentors = async (req, res) => {
  const { department, year, skill, search } = req.query;

  try {
    let query = {};

    if (department) {
      query.department = department;
    }
    if (year) {
      query.year = year;
    }
    if (skill) {
      // Find skills matching tag (case insensitive)
      query.skills = { $in: [new RegExp(skill, 'i')] };
    }
    if (search) {
      // Find matches in name or skills or department
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { department: searchRegex },
        { skills: { $in: [searchRegex] } }
      ];
    }

    const mentors = await Mentor.find(query).populate('userId', 'email github linkedin');
    res.status(200).json({
      success: true,
      count: mentors.length,
      mentors
    });
  } catch (error) {
    console.error('Fetch mentors error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get mentor by User ID or Mentor Document ID
// @route   GET /api/mentor/:id
// @access  Private
const getMentorById = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if ID matches userId or mentorId
    let mentor = await Mentor.findOne({ userId: id }).populate('userId', 'email github linkedin bio lastSeen');
    if (!mentor) {
      mentor = await Mentor.findById(id).populate('userId', 'email github linkedin bio lastSeen');
    }

    if (!mentor) {
      return res.status(404).json({ success: false, message: 'Mentor profile not found' });
    }

    res.status(200).json({
      success: true,
      mentor
    });
  } catch (error) {
    console.error('Fetch mentor detail error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Search Mentors
// @route   GET /api/mentor/search
// @access  Private
const searchMentors = async (req, res) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q, 'i');
    const mentors = await Mentor.find({
      $or: [
        { name: searchRegex },
        { department: searchRegex },
        { skills: { $in: [searchRegex] } }
      ]
    }).populate('userId', 'email github linkedin');

    res.status(200).json({
      success: true,
      count: mentors.length,
      mentors
    });
  } catch (error) {
    console.error('Search mentors error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Apply as mentor
// @route   POST /api/mentor/apply
// @access  Private
const applyMentor = async (req, res) => {
  const { skills, year, department, bio } = req.body;
  const userId = req.user._id;

  try {
    if (req.user.role === 'mentor') {
      return res.status(400).json({ success: false, message: 'You are already registered as a mentor.' });
    }

    const existing = await Mentor.findOne({ userId });
    if (existing) {
      if (existing.isApproved) {
        return res.status(400).json({ success: false, message: 'You are already an approved mentor.' });
      } else {
        return res.status(400).json({ success: false, message: 'Your application is already pending admin review.' });
      }
    }

    const skillsArray = Array.isArray(skills) 
      ? skills 
      : (skills ? skills.split(',').map(s => s.trim()) : []);

    const mentorApp = await Mentor.create({
      userId,
      name: req.user.name,
      skills: skillsArray,
      year: year || '',
      department: department || '',
      bio: bio || '',
      profilePhoto: req.user.profilePhoto || '',
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: 'Mentor application submitted successfully! Awaiting administrator approval.',
      mentor: mentorApp
    });
  } catch (error) {
    console.error('Apply mentor error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get current user's mentor application status
// @route   GET /api/mentor/application-status
// @access  Private
const getApplicationStatus = async (req, res) => {
  try {
    const app = await Mentor.findOne({ userId: req.user._id });
    if (!app) {
      return res.status(200).json({ success: true, status: 'none' });
    }
    res.status(200).json({
      success: true,
      status: app.isApproved ? 'approved' : 'pending',
      mentorDetails: app
    });
  } catch (error) {
    console.error('Get application status error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getAllMentors,
  getMentorById,
  searchMentors,
  applyMentor,
  getApplicationStatus
};
