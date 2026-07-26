const mongoose = require('mongoose');

const alumniProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  company: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  experience: {
    type: Number, // in years
    required: true
  },
  location: {
    type: String,
    required: true
  },
  linkedin: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  skills: [{
    type: String,
    default: []
  }],
  biography: {
    type: String,
    default: ''
  },
  currentCTC: {
    type: Number // in LPA (optional)
  },
  openForMentorship: {
    type: Boolean,
    default: true
  },
  openForReferral: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema);
