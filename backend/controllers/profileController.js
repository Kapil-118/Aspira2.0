const User = require('../models/user');
const Mentor = require('../models/mentor');

// @desc    Update user profile details
// @route   PUT /api/profile/update
// @access  Private
const updateProfile = async (req, res) => {
  const userId = req.user._id;
  const { name, bio, department, year, github, linkedin, skills } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    // Update base User properties
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (department !== undefined) user.department = department;
    if (year !== undefined) user.year = year;
    if (github !== undefined) user.github = github;
    if (linkedin !== undefined) user.linkedin = linkedin;
    
    // If a photo was uploaded via Multer, update it
    if (req.file && req.file.url) {
      user.profilePhoto = req.file.url;
    }

    await user.save();

    // If user is a mentor, keep the Mentor details synchronized!
    if (user.role === 'mentor') {
      let skillArray = [];
      if (skills) {
        // Parse skills if string or list format
        skillArray = Array.isArray(skills) 
          ? skills 
          : skills.split(',').map(s => s.trim()).filter(Boolean);
      }

      await Mentor.findOneAndUpdate(
        { userId },
        {
          name: user.name,
          bio: user.bio,
          department: user.department,
          year: user.year,
          profilePhoto: user.profilePhoto,
          skills: skillArray
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePhoto: user.profilePhoto,
        department: user.department,
        year: user.year,
        bio: user.bio,
        github: user.github,
        linkedin: user.linkedin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  updateProfile
};
