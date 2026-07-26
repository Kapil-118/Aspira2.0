const Conversation = require('../models/conversation');
const Message = require('../models/message');
const User = require('../models/user');

// @desc    Get all conversations for current user
// @route   GET /api/chat/conversations
// @access  Private
const getConversations = async (req, res) => {
  const userId = req.user._id;

  try {
    const conversations = await Conversation.find({
      participants: { $in: [userId] }
    })
    .populate('participants', 'name email profilePhoto role lastSeen')
    .sort({ updatedAt: -1 });

    // Filter out user details to find the active target participant and fetch last message
    const conversationList = await Promise.all(conversations.map(async convo => {
      const recipient = convo.participants.find(p => p._id.toString() !== userId.toString());
      
      const lastMessage = await Message.findOne({ 
        conversationId: convo._id,
        deletedBy: { $ne: userId }
      })
      .sort({ createdAt: -1 })
      .select('text fileUrl fileType sender createdAt isDeleted');

      return {
        _id: convo._id,
        recipient,
        lastMessage,
        updatedAt: convo.updatedAt
      };
    }));

    res.status(200).json({
      success: true,
      conversations: conversationList
    });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
const getMessages = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    // Check if user is participant of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view messages in this room' });
    }

    const messages = await Message.find({ 
      conversationId,
      deletedBy: { $ne: userId }
    })
    .populate('replyTo', 'text sender fileUrl fileType')
    .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Send message (alternative to Socket or as sync backup)
// @route   POST /api/chat/send
// @access  Private
const sendMessage = async (req, res) => {
  const { conversationId, text } = req.body;
  const senderId = req.user._id;

  try {
    if (!conversationId) {
      return res.status(400).json({ success: false, message: 'Conversation ID is required' });
    }

    if (!text && !req.file) {
      return res.status(400).json({ success: false, message: 'Message text or file attachment is required' });
    }

    // Verify participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.includes(senderId)) {
      return res.status(403).json({ success: false, message: 'Unauthorized sender' });
    }

    let fileUrl = '';
    let fileType = 'text';

    if (req.file) {
      fileUrl = req.file.url;
      const mime = req.file.mimetype || '';
      if (mime.startsWith('image/')) {
        fileType = 'image';
      } else if (mime === 'application/pdf') {
        fileType = 'pdf';
      }
    }

    const message = await Message.create({
      conversationId,
      sender: senderId,
      text: text || '',
      fileUrl,
      fileType,
      isSeen: false
    });

    // Update conversation updatedAt timestamp
    conversation.updatedAt = Date.now();
    await conversation.save();

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Mark messages in a conversation as seen
// @route   PUT /api/chat/messages-seen/:conversationId
// @access  Private
const markMessagesSeen = async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.user._id;

  try {
    // Set all messages sent by the other participant in this convo to isSeen = true
    const result = await Message.updateMany(
      { conversationId, sender: { $ne: userId }, isSeen: false },
      { $set: { isSeen: true } }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Upload file for chat attachment
// @route   POST /api/chat/upload
// @access  Private
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please select an image or PDF file to upload.' });
    }

    let fileType = 'text';
    const mime = req.file.mimetype || '';
    if (mime.startsWith('image/')) {
      fileType = 'image';
    } else if (mime === 'application/pdf') {
      fileType = 'pdf';
    }

    res.status(200).json({
      success: true,
      fileUrl: req.file.url,
      fileType
    });
  } catch (error) {
    console.error('Chat file upload error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markMessagesSeen,
  uploadFile
};
