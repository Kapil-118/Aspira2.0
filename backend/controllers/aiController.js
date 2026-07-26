const { analyzeResume, getCareerChatbotResponse } = require('../utils/aiHelper');

// @desc    Analyze student uploaded PDF resume
// @route   POST /api/ai/resume-analyze
// @access  Private
const analyzeResumeController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a resume PDF file' });
    }

    // Call the resume analyzer utility passing the buffer
    const insights = await analyzeResume(req.file.buffer);

    res.status(200).json({
      success: true,
      message: 'Resume analyzed successfully!',
      insights
    });
  } catch (error) {
    console.error('Resume analyze controller error:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
  }
};

// @desc    Ask Career AI Chatbot
// @route   POST /api/ai/chatbot
// @access  Private
const chatbotController = async (req, res) => {
  const { question } = req.body;

  try {
    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question cannot be empty' });
    }

    const answer = await getCareerChatbotResponse(question);

    res.status(200).json({
      success: true,
      answer
    });
  } catch (error) {
    console.error('Chatbot controller error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = {
  analyzeResumeController,
  chatbotController
};
