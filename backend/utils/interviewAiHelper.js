const axios = require('axios');

// Local High-Fidelity Question Bank Fallback
const questionBank = {
  'Technical Interview': {
    Easy: [
      'What is the difference between let, const, and var in JavaScript?',
      'Explain the concept of state and props in React.',
      'What is an Index in SQL databases and why is it used?',
      'What is the difference between process and thread in Operating Systems?',
      'Explain the concept of inheritance in Object-Oriented Programming.'
    ],
    Medium: [
      'Explain how the virtual DOM works in React and the reconciliation process.',
      'What are the differences between SQL and NoSQL databases? When would you use which?',
      'Explain the concept of promises in JavaScript and how async/await simplifies asynchronous code.',
      'How does the TCP 3-way handshake work in Computer Networks?',
      'Explain the difference between a binary tree and a binary search tree.'
    ],
    Hard: [
      'Describe the system design for a URL shortener like Bitly (endpoints, DB schemas, scaling).',
      'Explain Event Loop, Microtasks, and Macrotasks in NodeJS execution.',
      'Explain ACID properties in DBMS and how database systems enforce isolation levels.',
      'How do you scaling a MERN stack application to support 100k concurrent active connections?',
      'Write/describe a function to find the longest path in a directed acyclic graph.'
    ]
  },
  'HR Interview': {
    Easy: [
      'Tell me about yourself and your background.',
      'What are your greatest professional strengths and weaknesses?',
      'Why do you want to join our company?',
      'How do you manage stress and tight deadlines during academic exam seasons?'
    ],
    Medium: [
      'Describe a situation where you had to work in a team and faced a major conflict. How did you resolve it?',
      'Where do you see yourself in 5 years? What are your target career goals?',
      'Why should we hire you over other candidates for this engineering role?',
      'Describe a time you failed in a project. What did you learn and how did you pivot?'
    ],
    Hard: [
      'How would you handle a situation where your manager requests you to build a feature that violates user privacy laws?',
      'Describe a complex technical concept you learned recently. Explain it to someone with no computer science background.',
      'If you have multiple job offers, what parameters will you analyze to select your final employer?'
    ]
  },
  'System Design Interview': {
    Medium: [
      'Design a notification system (push, email, SMS) that handles millions of alerts daily.',
      'Design a real-time messaging chat system like Slack/WhatsApp (protocols, database schema).',
      'Design a rate limiter for an API gateway to prevent denial of service attacks.'
    ],
    Hard: [
      'Design a video streaming platform like Netflix (content delivery, database scaling, encoding pipeline).',
      'Design a ride-sharing dispatch system like Uber (spatial indexes, matching algorithm, scalability).',
      'Design a distributed cache system like Redis (eviction policies, consistency, clustering).'
    ]
  },
  'Behavioral Interview': {
    Easy: [
      'Describe a project you worked on recently that you are proud of.',
      'How do you handle feedback or criticism from your team members?',
      'What is your ideal work environment?'
    ],
    Medium: [
      'Tell me about a time you took a leadership role in a college event or group project.',
      'Describe a time you had to learn a completely new framework/programming language in a short duration.',
      'How do you handle disagreement with a mentor or senior developer?'
    ],
    Hard: [
      'Describe a time you had to make a quick decision without all the necessary details. What was the outcome?',
      'Tell me about a time you went above and beyond your assigned duties to complete an engineering deliverable.'
    ]
  }
};

const defaultQuestions = [
  'Explain your experience working with full stack development frameworks.',
  'What are your primary technical skills and how do you keep them updated?',
  'Explain the concept of REST APIs and how clients communicate with servers.',
  'What are your goals for professional growth over the next twelve months?'
];

// Fallback helper to fetch question locally
const getLocalQuestion = (type, difficulty, index) => {
  const categories = questionBank[type] || questionBank['Technical Interview'];
  const questionsList = categories[difficulty] || categories['Medium'] || defaultQuestions;
  return questionsList[index % questionsList.length];
};

/**
 * Generate next question using HuggingFace Inference API, or falls back to local bank.
 */
const generateNextQuestion = async (sessionData, currentQuestionIndex) => {
  const { interviewType, difficulty, questions, answers } = sessionData;

  const hfToken = process.env.HUGGING_FACE_TOKEN;
  if (!hfToken) {
    return getLocalQuestion(interviewType, difficulty, currentQuestionIndex);
  }

  try {
    // Construct progressive context prompt
    let prompt = `System: You are an expert technical and HR interviewer. Generate the next question for a ${difficulty} difficulty ${interviewType}.`;
    
    if (questions && questions.length > 0) {
      prompt += ` Previous conversation history:\n`;
      questions.forEach((q, idx) => {
        prompt += `Interviewer: ${q}\n`;
        if (answers[idx]) {
          prompt += `Candidate: ${answers[idx]}\n`;
        }
      });
    }
    
    prompt += `Generate only the next interview question. Do not output anything else.`;

    const response = await axios.post(
      'https://api-inference.huggingface.co/models/google/flan-t5-large',
      { inputs: prompt, parameters: { max_new_tokens: 60, temperature: 0.7 } },
      { headers: { Authorization: `Bearer ${hfToken}` }, timeout: 6000 }
    );

    if (response.data && response.data[0] && response.data[0].generated_text) {
      const generated = response.data[0].generated_text.trim();
      if (generated.length > 10) return generated;
    }
    throw new Error('Fallback to local bank');
  } catch (error) {
    return getLocalQuestion(interviewType, difficulty, currentQuestionIndex);
  }
};

/**
 * Scoring and evaluation engine.
 * Calculates detailed metrics based on keyword matching, assertions, semantic markers.
 */
const evaluateAnswers = async (questions, answers, type, difficulty) => {
  const result = {
    scores: {
      technicalAccuracy: 70,
      communication: 70,
      confidence: 70,
      problemSolving: 70,
      overallScore: 70
    },
    feedback: {
      strengths: [],
      weaknesses: [],
      missedConcepts: [],
      learningResources: []
    }
  };

  // 1. Perform semantic parsing over answers
  let totalLength = 0;
  let positiveAssertions = 0;
  let hesitationKeywords = 0;
  let matchedDomainKeywords = 0;

  const keyTechTerms = [
    'react', 'dom', 'component', 'state', 'props', 'hook', 'redux', 'node', 'express', 'middleware', 'api', 'rest',
    'mongodb', 'sql', 'index', 'query', 'join', 'acid', 'oop', 'class', 'inheritance', 'polymorphism', 'promise',
    'async', 'event loop', 'scaling', 'cache', 'security', 'jwt', 'auth'
  ];

  answers.forEach((ans) => {
    const text = (ans || '').toLowerCase();
    totalLength += text.split(/\s+/).length;

    // Check positive markers
    if (text.includes('because') || text.includes('example') || text.includes('firstly') || text.includes('secondly')) {
      positiveAssertions += 2;
    }

    // Check hesitation markers
    if (text.includes("i don't know") || text.includes('not sure') || text.includes('maybe') || text.includes('probably')) {
      hesitationKeywords += 1;
    }

    // Technical term checks
    keyTechTerms.forEach(term => {
      if (text.includes(term)) {
        matchedDomainKeywords += 1;
      }
    });
  });

  // 2. Compute dynamic metrics
  const count = answers.length || 1;
  const avgWordsPerAnswer = totalLength / count;

  // Technical Accuracy: based on tech terms and hesitation
  let techScore = 70 + Math.min(matchedDomainKeywords * 3, 20) - (hesitationKeywords * 4);
  techScore = Math.max(50, Math.min(techScore, 95));

  // Communication: length of response, logical structure (assertions)
  let commScore = 65 + Math.min(avgWordsPerAnswer / 5, 20) + Math.min(positiveAssertions * 2, 10);
  commScore = Math.max(50, Math.min(commScore, 95));

  // Confidence: hesitation penalty, positive assertions bonus
  let confScore = 80 - (hesitationKeywords * 6) + Math.min(positiveAssertions, 10);
  confScore = Math.max(50, Math.min(confScore, 95));

  // Problem Solving: difficulty factor, response lengths
  let psScore = 70;
  if (difficulty === 'Hard') psScore += 10;
  if (difficulty === 'Easy') psScore -= 5;
  psScore += Math.min(matchedDomainKeywords * 2, 15) - (hesitationKeywords * 2);
  psScore = Math.max(50, Math.min(psScore, 95));

  // Overall Score (average)
  const overall = Math.round((techScore + commScore + confScore + psScore) / 4);

  result.scores = {
    technicalAccuracy: Math.round(techScore),
    communication: Math.round(commScore),
    confidence: Math.round(confScore),
    problemSolving: Math.round(psScore),
    overallScore: overall
  };

  // 3. Assemble Custom Feedback Reports
  if (commScore > 75) {
    result.feedback.strengths.push('Excellent structure in explanation; candidates uses clear illustrative examples.');
  } else {
    result.feedback.weaknesses.push('Answers are slightly brief. Try expanding explanations with practical use-cases or structural markers (e.g. Firstly, For instance).');
  }

  if (techScore > 75) {
    result.feedback.strengths.push('Demonstrates solid foundational technical knowledge matching domain skills matrices.');
  } else {
    result.feedback.weaknesses.push('Some technical concepts lacked depth. Focus on explaining core operational mechanics (e.g. Lifecycle states, ACID execution details).');
  }

  if (confScore < 70) {
    result.feedback.weaknesses.push('High frequency of uncertainty markers ("not sure", "don\'t know"). Build confidence by asserting what you do know first.');
  } else {
    result.feedback.strengths.push('Maintains an assertive and professional communication tone throughout answers.');
  }

  // Domain Concept Recommendations & Resources
  if (matchedDomainKeywords < 5) {
    result.feedback.missedConcepts.push('Systems Scaling, Database indexing structures, and Asynchronous execution frameworks.');
    result.feedback.learningResources.push('Read System Design Primer (Github), MDN Web Docs async manuals, and GeeksforGeeks DBMS concepts.');
  } else {
    result.feedback.missedConcepts.push('Advanced scaling pipelines (Redis Caching, Horizontal Scaling topologies).');
    result.feedback.learningResources.push('Read High-Scalability system architecture logs and advanced design specifications.');
  }

  return result;
};

module.exports = {
  generateNextQuestion,
  evaluateAnswers
};
