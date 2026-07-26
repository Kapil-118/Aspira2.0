const mongoose = require('mongoose');

const mentorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  skills: {
    type: [String],
    default: []
  },
  year: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Mentor', mentorSchema);
