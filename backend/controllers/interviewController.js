const InterviewSession = require('../models/interviewSession');
const User = require('../models/user');
const { generateNextQuestion, evaluateAnswers } = require('../utils/interviewAiHelper');

// @desc    Start new AI Mock Interview Session
// @route   POST /api/interview/start
// @access  Private
const startSession = async (req, res) => {
  const studentId = req.user._id;
  const { interviewType, difficulty, duration, questionCount } = req.body;

  try {
    if (!interviewType || !difficulty || !duration || !questionCount) {
      return res.status(400).json({ success: false, message: 'All configuration parameters are required.' });
    }

    // Try to get user's skills for personalization
    let skills = [];
    if (req.user.skills) {
      skills = req.user.skills;
    } else {
      // Fallback check user department/bio keywords
      const bioText = (req.user.bio || '').toLowerCase();
      if (bioText.includes('react')) skills.push('React');
      if (bioText.includes('node')) skills.push('Node.js');
      if (bioText.includes('python')) skills.push('Python');
    }

    // Create session placeholder
    const session = new InterviewSession({
      studentId,
      interviewType,
      difficulty,
      duration: parseInt(duration),
      questionCount: parseInt(questionCount),
      topics: skills.length > 0 ? skills : ['General Frameworks'],
      questions: [],
      answers: [],
      scores: {},
      feedback: {}
    });

    // Generate first question
    const firstQuestion = await generateNextQuestion(session, 0);
    session.questions.push(firstQuestion);
    await session.save();

    res.status(201).json({
      success: true,
      message: 'Interview session initiated successfully!',
      session: {
        _id: session._id,
        interviewType: session.interviewType,
        difficulty: session.difficulty,
        questionCount: session.questionCount,
        topics: session.topics,
        firstQuestion
      }
    });
  } catch (error) {
    console.error('Start interview session error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Submit candidate answer and fetch next question or complete interview session
// @route   POST /api/interview/submit-answer
// @access  Private
const submitAnswer = async (req, res) => {
  const { sessionId, answer } = req.body;

  try {
    const session = await InterviewSession.findOne({ _id: sessionId, studentId: req.user._id });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found.' });
    }

    // Save answer
    session.answers.push(answer || 'No response provided.');
    const currentAnswerIndex = session.answers.length;

    // Check if session has reached requested question limit
    if (currentAnswerIndex >= session.questionCount) {
      // Complete and evaluate
      const evalData = await evaluateAnswers(session.questions, session.answers, session.interviewType, session.difficulty);
      
      session.scores = evalData.scores;
      session.feedback = evalData.feedback;
      await session.save();

      return res.status(200).json({
        success: true,
        isFinished: true,
        message: 'Mock Interview Session Completed!',
        scores: session.scores,
        feedback: session.feedback
      });
    }

    // Generate and push next question
    const nextQuestion = await generateNextQuestion(session, currentAnswerIndex);
    session.questions.push(nextQuestion);
    await session.save();

    res.status(200).json({
      success: true,
      isFinished: false,
      nextQuestion,
      questionIndex: currentAnswerIndex + 1
    });
  } catch (error) {
    console.error('Submit answer error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get session histories
// @route   GET /api/interview/history
// @access  Private
const getHistory = async (req, res) => {
  const studentId = req.user._id;

  try {
    const sessions = await InterviewSession.find({ studentId }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error('Fetch history error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

// @desc    Get leaderboard rankings
// @route   GET /api/interview/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    // Aggregation pipeline to select highest overallScore per student
    const leaderboard = await InterviewSession.aggregate([
      { $match: { 'scores.overallScore': { $gt: 0 } } },
      {
        $group: {
          _id: '$studentId',
          highestScore: { $max: '$scores.overallScore' },
          sessionsCompleted: { $sum: 1 }
        }
      },
      { $sort: { highestScore: -1 } },
      { $limit: 10 }
    ]);

    // Populate user profile info manually
    const rankings = await Promise.all(leaderboard.map(async (entry) => {
      const user = await User.findById(entry._id).select('name department profilePhoto year');
      return {
        student: user || { name: 'Anonymous Student' },
        highestScore: entry.highestScore,
        sessionsCompleted: entry.sessionsCompleted
      };
    }));

    res.status(200).json({
      success: true,
      rankings
    });
  } catch (error) {
    console.error('Fetch leaderboard error:', error.message);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  startSession,
  submitAnswer,
  getHistory,
  getLeaderboard
};
