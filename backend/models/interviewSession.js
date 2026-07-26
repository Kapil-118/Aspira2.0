const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  interviewType: {
    type: String,
    enum: ['Technical Interview', 'HR Interview', 'System Design Interview', 'Behavioral Interview', 'Mixed Interview'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  questionCount: {
    type: Number,
    required: true
  },
  topics: [{
    type: String
  }],
  questions: [{
    type: String
  }],
  answers: [{
    type: String
  }],
  scores: {
    technicalAccuracy: { type: Number, default: 0 },
    communication: { type: Number, default: 0 },
    confidence: { type: Number, default: 0 },
    problemSolving: { type: Number, default: 0 },
    overallScore: { type: Number, default: 0 }
  },
  feedback: {
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    missedConcepts: [{ type: String }],
    learningResources: [{ type: String }]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
