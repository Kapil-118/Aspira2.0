const mongoose = require('mongoose');

const placementApplicationSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  package: {
    type: Number, // in LPA
    required: true
  },
  applicationDate: {
    type: Date,
    default: Date.now
  },
  applicationSource: {
    type: String,
    default: 'Direct'
  },
  status: {
    type: String,
    enum: [
      'Applied',
      'OA Scheduled',
      'OA Completed',
      'Shortlisted',
      'Technical Interview 1',
      'Technical Interview 2',
      'Managerial Round',
      'HR Round',
      'Offer Received',
      'Rejected',
      'Withdrawn'
    ],
    default: 'Applied'
  },
  currentRound: {
    type: String,
    default: 'Initial Application'
  },
  notes: {
    type: String,
    default: ''
  },
  interviewDate: {
    type: Date
  },
  jobDescriptionLink: {
    type: String,
    default: ''
  },
  referralUsed: {
    type: Boolean,
    default: false
  },
  referralPerson: {
    type: String,
    default: ''
  },
  result: {
    type: String,
    enum: ['Pending', 'Selected', 'Rejected'],
    default: 'Pending'
  },
  timeline: [{
    round: { type: String, required: true },
    date: { type: Date, default: Date.now },
    feedback: { type: String, default: '' },
    result: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('PlacementApplication', placementApplicationSchema);
