const User = require('../models/user');
const Mentor = require('../models/mentor');
const AlumniProfile = require('../models/alumniProfile');
const Notification = require('../models/notification');

// @desc    Get pending mentors list
// @route   GET /api/admin/pending-mentors
// @access  Private/Admin
const getPendingMentors = async (req, res) => {
  try {
    const pending = await Mentor.find({ isApproved: false }).populate('userId', 'email name profilePhoto role');
    res.status(200).json({ success: true, pending });
  } catch (error) {
    console.error('Get pending mentors error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Approve a mentor application
// @route   PUT /api/admin/approve-mentor/:id
// @access  Private/Admin
const approveMentor = async (req, res) => {
  const { id } = req.params; // userId
  try {
    const mentorApp = await Mentor.findOne({ userId: id });
    if (!mentorApp) {
      return res.status(404).json({ success: false, message: 'Mentor application profile not found' });
    }

    mentorApp.isApproved = true;
    await mentorApp.save();

    const user = await User.findById(id);
    if (user) {
      user.role = 'mentor';
      await user.save();
    }

    // Notify user of mentor application approval
    await Notification.create({
      recipient: id,
      sender: req.user._id,
      type: 'mentor_approved',
      text: 'Congratulations! Your campus mentor application has been approved by the administrator.'
    });

    res.status(200).json({ success: true, message: 'Mentor application approved successfully!' });
  } catch (error) {
    console.error('Approve mentor error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Reject/delete a mentor application
// @route   DELETE /api/admin/reject-mentor/:id
// @access  Private/Admin
const rejectMentor = async (req, res) => {
  const { id } = req.params; // userId
  try {
    const mentorApp = await Mentor.findOne({ userId: id });
    if (!mentorApp) {
      return res.status(404).json({ success: false, message: 'Mentor application profile not found' });
    }

    await Mentor.findOneAndDelete({ userId: id });

    // Notify user of mentor application rejection
    await Notification.create({
      recipient: id,
      sender: req.user._id,
      type: 'mentor_rejected',
      text: 'Your campus mentor application has been declined by the administrator.'
    });

    res.status(200).json({ success: true, message: 'Mentor application rejected successfully.' });
  } catch (error) {
    console.error('Reject mentor error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get pending alumni list
// @route   GET /api/admin/pending-alumni
// @access  Private/Admin
const getPendingAlumni = async (req, res) => {
  try {
    const pending = await AlumniProfile.find({ isApproved: false }).populate('userId', 'email name profilePhoto role');
    res.status(200).json({ success: true, pending });
  } catch (error) {
    console.error('Get pending alumni error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Approve an alumni application
// @route   PUT /api/admin/approve-alumni/:id
// @access  Private/Admin
const approveAlumni = async (req, res) => {
  const { id } = req.params; // userId
  try {
    const alumniApp = await AlumniProfile.findOne({ userId: id });
    if (!alumniApp) {
      return res.status(404).json({ success: false, message: 'Alumni application profile not found' });
    }

    alumniApp.isApproved = true;
    await alumniApp.save();

    const user = await User.findById(id);
    if (user) {
      user.role = 'alumni';
      await user.save();
    }

    // Notify user of alumni application approval
    await Notification.create({
      recipient: id,
      sender: req.user._id,
      type: 'request_accepted',
      text: 'Congratulations! Your alumni verification application has been approved by the administrator.'
    });

    res.status(200).json({ success: true, message: 'Alumni application approved successfully!' });
  } catch (error) {
    console.error('Approve alumni error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Reject/delete an alumni application
// @route   DELETE /api/admin/reject-alumni/:id
// @access  Private/Admin
const rejectAlumni = async (req, res) => {
  const { id } = req.params; // userId
  try {
    const alumniApp = await AlumniProfile.findOne({ userId: id });
    if (!alumniApp) {
      return res.status(404).json({ success: false, message: 'Alumni application profile not found' });
    }

    await AlumniProfile.findOneAndDelete({ userId: id });

    // Notify user of alumni application rejection
    await Notification.create({
      recipient: id,
      sender: req.user._id,
      type: 'request_rejected',
      text: 'Your alumni verification application has been declined by the administrator.'
    });

    res.status(200).json({ success: true, message: 'Alumni application rejected successfully.' });
  } catch (error) {
    console.error('Reject alumni error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getPendingMentors,
  approveMentor,
  rejectMentor,
  getPendingAlumni,
  approveAlumni,
  rejectAlumni
};
