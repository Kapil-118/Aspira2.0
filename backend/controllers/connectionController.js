const ConnectionRequest = require('../models/connectionRequest');
const Conversation = require('../models/conversation');
const Notification = require('../models/notification');
const User = require('../models/user');
const Mentor = require('../models/mentor');

// @desc    Send connection request from student to mentor
// @route   POST /api/connections/send/:mentorId
// @access  Private
const sendRequest = async (req, res) => {
  const { mentorId } = req.params; // User ID of the mentor
  const studentId = req.user._id;

  try {
    if (studentId.toString() === mentorId) {
      return res.status(400).json({ success: false, message: 'You cannot send a connection request to yourself' });
    }

    // Verify recipient is a mentor
    const recipient = await User.findById(mentorId);
    if (!recipient || recipient.role !== 'mentor') {
      return res.status(404).json({ success: false, message: 'Target mentor not found or invalid role' });
    }

    // Check for existing connection request (pending or accepted)
    const existingRequest = await ConnectionRequest.findOne({
      studentId,
      mentorId,
      status: { $in: ['pending', 'accepted'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'A connection request between you is already pending or accepted'
      });
    }

    const request = await ConnectionRequest.create({
      studentId,
      mentorId,
      status: 'pending'
    });

    // Create a real-time Notification
    await Notification.create({
      recipient: mentorId,
      sender: studentId,
      type: 'request_sent',
      text: `${req.user.name} sent you a mentorship connection request.`
    });

    res.status(201).json({
      success: true,
      message: 'Connection request sent successfully!',
      request
    });
  } catch (error) {
    console.error('Send connection request error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Accept connection request
// @route   PUT /api/connections/accept/:id
// @access  Private (Mentors only)
const acceptRequest = async (req, res) => {
  const { id } = req.params; // Request document ID
  const mentorId = req.user._id;

  try {
    const request = await ConnectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Connection request not found' });
    }

    // Verify recipient is indeed the logged-in mentor
    if (request.mentorId.toString() !== mentorId.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'accepted';
    await request.save();

    // Automatically create conversation document
    let conversation = await Conversation.findOne({
      participants: { $all: [request.studentId, request.mentorId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [request.studentId, request.mentorId]
      });
    }

    // Create Notification for the student
    await Notification.create({
      recipient: request.studentId,
      sender: mentorId,
      type: 'request_accepted',
      text: `${req.user.name} accepted your mentorship connection request.`
    });

    res.status(200).json({
      success: true,
      message: 'Connection request accepted!',
      request,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Accept connection request error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Reject connection request
// @route   PUT /api/connections/reject/:id
// @access  Private (Mentors only)
const rejectRequest = async (req, res) => {
  const { id } = req.params;
  const mentorId = req.user._id;

  try {
    const request = await ConnectionRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Connection request not found' });
    }

    if (request.mentorId.toString() !== mentorId.toString()) {
      return res.status(403).json({ success: false, message: 'You do not have permission to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    request.status = 'rejected';
    await request.save();

    // Create Notification for the student
    await Notification.create({
      recipient: request.studentId,
      sender: mentorId,
      type: 'request_rejected',
      text: `${req.user.name} declined your mentorship connection request.`
    });

    res.status(200).json({
      success: true,
      message: 'Connection request rejected.',
      request
    });
  } catch (error) {
    console.error('Reject connection request error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get sent and incoming requests list
// @route   GET /api/connections/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  const userId = req.user._id;
  const { role } = req.user;

  try {
    let requests;
    if (role === 'mentor') {
      // Mentors see incoming requests sent by students
      requests = await ConnectionRequest.find({ mentorId: userId })
        .populate('studentId', 'name email profilePhoto department year bio');
    } else {
      // Students see requests they sent to mentors
      requests = await ConnectionRequest.find({ studentId: userId })
        .populate('mentorId', 'name email profilePhoto department year bio');
    }

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Fetch my requests error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get active, accepted connections
// @route   GET /api/connections/my-connections
// @access  Private
const getMyConnections = async (req, res) => {
  const userId = req.user._id;
  const { role } = req.user;

  try {
    let connections = [];
    if (role === 'mentor') {
      // Mentors see students who connected
      const requests = await ConnectionRequest.find({ mentorId: userId, status: 'accepted' })
        .populate('studentId', 'name email profilePhoto department year github linkedin bio lastSeen');
      connections = requests.map(r => r.studentId);
    } else {
      // Students see mentors they connected with
      const requests = await ConnectionRequest.find({ studentId: userId, status: 'accepted' })
        .populate('mentorId', 'name email profilePhoto department year github linkedin bio lastSeen');
      connections = requests.map(r => r.mentorId);
    }

    res.status(200).json({
      success: true,
      count: connections.length,
      connections
    });
  } catch (error) {
    console.error('Fetch my connections error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getMyRequests,
  getMyConnections
};
