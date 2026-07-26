const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['request_sent', 'request_accepted', 'request_rejected', 'message', 'mentor_approved', 'mentor_rejected'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.post('save', async function(doc) {
  try {
    const { sendPushNotification } = require('../controllers/pushController');
    let title = 'Aspira Update';
    
    // Map notification types to friendly headings
    if (doc.type === 'request_sent') title = 'Connection Request';
    else if (doc.type === 'request_accepted') title = 'Request Approved';
    else if (doc.type === 'request_rejected') title = 'Request Rejected';
    else if (doc.type === 'mentor_approved') title = 'Mentor Verified';
    else if (doc.type === 'mentor_rejected') title = 'Mentor Review';
    else if (doc.type === 'message') title = 'New Message';

    await sendPushNotification(doc.recipient, title, doc.text);
  } catch (err) {
    console.error('Push notification post-save hook error:', err.message);
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
