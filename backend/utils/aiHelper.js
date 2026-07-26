const pdfParse = require('pdf-parse');
const axios = require('axios');

/**
 * Extracts raw text from a PDF file buffer.
 */
const extractTextFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF document.');
  }
};

/**
 * Generates dynamic resume insights using a rule-based parser.
 * This ensures the application works immediately without third-party AI keys.
 */
const generateLocalInsights = (text) => {
  const lowercaseText = text.toLowerCase();
  
  // Find key links
  const hasGithub = lowercaseText.includes('github.com');
  const hasLinkedin = lowercaseText.includes('linkedin.com');
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(lowercaseText);
  const hasPhone = /\+?\d{10,13}/.test(lowercaseText) || /\d{3}-\d{3}-\d{4}/.test(lowercaseText);

  // Core sections check
  const sections = {
    education: lowercaseText.includes('education') || lowercaseText.includes('university') || lowercaseText.includes('college'),
    experience: lowercaseText.includes('experience') || lowercaseText.includes('employment') || lowercaseText.includes('work history'),
    projects: lowercaseText.includes('projects') || lowercaseText.includes('personal projects'),
    skills: lowercaseText.includes('skills') || lowercaseText.includes('technical skills') || lowercaseText.includes('expertise')
  };

  // Find tech stack keywords
  const techKeywords = ['react', 'node', 'express', 'mongodb', 'javascript', 'python', 'java', 'c++', 'html', 'css', 'sql', 'docker', 'aws', 'git', 'typescript'];
  const matchedSkills = techKeywords.filter(skill => lowercaseText.includes(skill));

  const strengths = [];
  const improvements = [];

  // Check strengths
  if (sections.experience) strengths.push('Has a dedicated Professional Experience section highlighting practical engineering work.');
  if (sections.projects) strengths.push('Contains structured Projects detailing technical implementation and outcomes.');
  if (sections.skills && matchedSkills.length > 3) {
    strengths.push(`Identifies a strong base of key technical skills (${matchedSkills.slice(0, 4).join(', ')}).`);
  }
  if (hasGithub || hasLinkedin) strengths.push('Includes links to professional profiles (GitHub/LinkedIn), making project portfolios verifiable.');
  if (hasEmail && hasPhone) strengths.push('Contact information is complete and formatted correctly.');

  // Check improvements
  if (!sections.experience) improvements.push('Add a dedicated Work Experience section detailing previous internships or jobs.');
  if (!sections.projects) improvements.push('Add a Projects section showcasing your best development scripts and full stack code.');
  if (!hasGithub) improvements.push('Include a GitHub URL pointing to your source repositories so recruiters can audit your code.');
  if (!hasLinkedin) improvements.push('Include a LinkedIn profile link to improve professional branding and visibility.');
  if (matchedSkills.length < 3) improvements.push('List more specific, industry-relevant libraries, frameworks, or programming languages in a dedicated Skills matrix.');
  if (!lowercaseText.includes('achievements') && !lowercaseText.includes('certifications')) {
    improvements.push('Incorporate an Achievements or Certifications section to quantify your professional successes.');
  }

  // Final fallback list safety
  if (strengths.length === 0) strengths.push('Basic resume layout parsed successfully.');
  if (improvements.length === 0) improvements.push('Include metrics and quantifiable values (e.g. % speeds, dollar figures) in project descriptions.');

  // Build local summary representation
  let parsedName = 'Candidate';
  const nameLine = text.split('\n')[0]?.trim();
  if (nameLine && nameLine.length > 2 && nameLine.length < 40 && !nameLine.toLowerCase().includes('resume')) {
    parsedName = nameLine;
  }

  const executiveSummary = `Resume summary for ${parsedName}: Highly focused software engineering candidate possessing core strengths in ${matchedSkills.slice(0, 3).join(', ') || 'development'}. Demonstrates foundational technical competencies with an interest in web application design, team collaboration, and resolving complex codebase issues.`;

  return {
    executiveSummary,
    strengths,
    improvements,
    matchedSkills
  };
};

/**
 * Summarizes resume text using Hugging Face's BART API, or falls back to rule-based generation.
 */
const summarizeWithBART = async (text, hfToken) => {
  try {
    const payload = {
      inputs: text.substring(0, 3000), // Truncate text to fit context constraints
      parameters: { max_length: 120, min_length: 40, do_sample: false }
    };
    
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/facebook/bart-large-cnn',
      payload,
      { headers: { Authorization: `Bearer ${hfToken}` }, timeout: 8000 }
    );

    if (response.data && response.data[0] && response.data[0].summary_text) {
      return response.data[0].summary_text;
    }
    throw new Error('No summary text returned from Hugging Face');
  } catch (error) {
    console.warn('Hugging Face BART API call failed or timed out. Using high-fidelity local summary parser.');
    return null;
  }
};

/**
 * Main function invoked by the controller.
 */
const analyzeResume = async (fileBuffer) => {
  const rawText = await extractTextFromPDF(fileBuffer);
  const insights = generateLocalInsights(rawText);
  
  const hfToken = process.env.HUGGING_FACE_TOKEN;
  if (hfToken) {
    const bartSummary = await summarizeWithBART(rawText, hfToken);
    if (bartSummary) {
      insights.executiveSummary = bartSummary;
    }
  }

  return insights;
};

/**
 * Generates an response from the Career Chatbot based on user questions.
 */
const getCareerChatbotResponse = async (question) => {
  const query = question.toLowerCase();
  
  // Custom response mapping
  if (query.includes('resume') || query.includes('cv')) {
    return "To optimize your resume, ensure it includes clean, separate sections for Contact details, Skills, Experience, and Projects. You can use our built-in **Resume Analyzer** tab to upload your resume PDF and receive instant feedback on key strengths and missing improvements!";
  }
  if (query.includes('interview') || query.includes('prep')) {
    return "For coding interviews, focus on data structures, algorithms, system design, and building real-world MERN projects. Mentors on **Aspira** can schedule mock interviews. Visit the **Events** page to register for upcoming workshops!";
  }
  if (query.includes('mentor') || query.includes('connect')) {
    return "You can find mentors by browsing the **Mentor Directory**. Filter mentors by tech stack skills, year, or department. Once you find a mentor, click **Connect** to send a connection request. When they accept, you can start a private chat or video call!";
  }
  if (query.includes('lost') || query.includes('found')) {
    return "Losing items on campus is common! Aspira includes a **Lost & Found** board. Go to the Lost & Found tab to post description and details of the item, upload its image, or check if someone has found and posted it.";
  }
  if (query.includes('react') || query.includes('mern') || query.includes('node')) {
    return "MERN stack (MongoDB, Express, React, Node) is highly demanded. Focus on learning state management (like React Context/Redux), Axios request interceptors, REST API design, and WebSocket programming with Socket.IO for real-time applications.";
  }

  // Default chat assistant guidance response
  return "That is a great question! As your Aspira Career Assistant, I recommend connecting with a specialized mentor in our Directory who matches your department or target career field. They can provide personalized, 1-on-1 career mapping, review your github portfolios, and invite you to private mock coding sessions.";
};

module.exports = {
  analyzeResume,
  getCareerChatbotResponse
};
