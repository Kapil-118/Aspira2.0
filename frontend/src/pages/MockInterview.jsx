import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Mic, 
  MicOff, 
  Send, 
  Terminal, 
  Award, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  History,
  TrendingUp,
  Cpu,
  Trophy,
  RefreshCw,
  Clock,
  Play
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const MockInterview = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('practice'); // 'practice', 'history', 'leaderboard', 'achievements'
  
  // Restricted check
  const isEligible = ['3', '4', 'Third Year', 'Fourth Year'].includes(user?.year) || user?.role === 'admin';

  // Configuration Setup State
  const [type, setType] = useState('Technical Interview');
  const [difficulty, setDifficulty] = useState('Medium');
  const [duration, setDuration] = useState('30');
  const [qCount, setQCount] = useState('5');
  const [startingSession, setStartingSession] = useState(false);

  // Active Session State
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [questionNum, setQuestionNum] = useState(1);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const timerRef = useRef(null);

  // Voice Input Speech Recognition States
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  // Completed Evaluation Report
  const [report, setReport] = useState(null);

  // Lists & Rankings
  const [historyList, setHistoryList] = useState([]);
  const [leaderboardList, setLeaderboardList] = useState([]);

  useEffect(() => {
    if (!isEligible) {
      setLoading(false);
      return;
    }
    fetchHistoryAndLeaderboard();
  }, []);

  const fetchHistoryAndLeaderboard = async () => {
    try {
      const [histRes, leadRes] = await Promise.all([
        API.get('/interview/history'),
        API.get('/interview/leaderboard')
      ]);
      if (histRes.data.success) setHistoryList(histRes.data.sessions);
      if (leadRes.data.success) setLeaderboardList(leadRes.data.rankings);
    } catch (err) {
      console.error('Fetch interview components error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech API initialization
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return toast.error('Speech recognition is not supported in this browser.', { theme: 'dark' });
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = (e) => {
      console.error('Speech error:', e);
      setIsListening(false);
    };
    rec.onresult = (event) => {
      const resultText = event.results[event.results.length - 1][0].transcript;
      setAnswerText((prev) => prev + ' ' + resultText);
    };

    rec.start();
    recognitionRef.current = rec;
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleStartInterview = async () => {
    setStartingSession(true);
    try {
      const res = await API.post('/interview/start', {
        interviewType: type,
        difficulty,
        duration,
        questionCount: qCount
      });

      if (res.data.success) {
        setSession(res.data.session);
        setCurrentQuestion(res.data.session.firstQuestion);
        setQuestionNum(1);
        setAnswerText('');
        setReport(null);
        setTimeLeft(parseInt(duration) * 60);

        // Start Countdown Timer
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleEndSessionEarly();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      toast.error('Failed to start interview session.', { theme: 'dark' });
    } finally {
      setStartingSession(false);
    }
  };

  const handleEndSessionEarly = () => {
    toast.warning('Time limit exceeded. Processing evaluation.', { theme: 'dark' });
    // Finalize report mock submit
    submitAnswer(true);
  };

  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault();
    if (!answerText.trim() && !submittingAnswer) {
      return toast.error('Please enter or record an answer before submitting.', { theme: 'dark' });
    }

    stopListening();
    setSubmittingAnswer(true);
    try {
      const res = await API.post('/interview/submit-answer', {
        sessionId: session._id,
        answer: answerText
      });

      if (res.data.success) {
        if (res.data.isFinished) {
          // Display Report
          setReport(res.data);
          setSession(null);
          if (timerRef.current) clearInterval(timerRef.current);
          fetchHistoryAndLeaderboard();
        } else {
          setCurrentQuestion(res.data.nextQuestion);
          setQuestionNum(res.data.questionIndex);
          setAnswerText('');
        }
      }
    } catch (err) {
      toast.error('Could not submit answer.', { theme: 'dark' });
    } finally {
      setSubmittingAnswer(false);
    }
  };

  // Calculate experience badges dynamically
  const completedCount = historyList.length;
  const highestGrade = historyList.reduce((max, s) => Math.max(max, s.scores?.overallScore || 0), 0);
  const experiencesPoints = completedCount * 150;
  const userLevel = Math.floor(experiencesPoints / 500) + 1;

  const achievements = [
    { name: 'Interview Beginner', desc: 'Complete your first practice session.', unlocked: completedCount >= 1 },
    { name: 'DSA Challenger', desc: 'Initiate a hard-level Technical Interview session.', unlocked: historyList.some(s => s.difficulty === 'Hard') },
    { name: 'Placement Warrior', desc: 'Secure an overall score above 80%.', unlocked: highestGrade >= 80 },
    { name: 'Offer Hunter', desc: 'Complete at least 5 simulation sessions.', unlocked: completedCount >= 5 }
  ];

  if (loading) return <LoadingSpinner size="large" />;

  if (!isEligible) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center text-center p-6">
        <AlertTriangle className="w-16 h-16 text-indigo-500/30 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-200">Restricted Section</h2>
        <p className="text-gray-400 text-sm mt-2 max-w-sm">
          AI Mock Interview system becomes available from Third Year onwards.
        </p>
        <Link to="/dashboard" className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Header Tabs */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden border border-white/10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            AI Mock <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Interview</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1.5 leading-relaxed max-w-xl">
            Simulate realistic technical, HR, and System Design interviews with live dynamic scoring.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-black/30 border border-white/5 rounded-xl p-1 gap-1">
          <button
            onClick={() => { setActiveTab('practice'); setReport(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'practice' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Cpu className="w-3.5 h-3.5 inline mr-1.5" />
            Practice
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'history' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <History className="w-3.5 h-3.5 inline mr-1.5" />
            History
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'leaderboard' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Trophy className="w-3.5 h-3.5 inline mr-1.5" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${activeTab === 'achievements' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Award className="w-3.5 h-3.5 inline mr-1.5" />
            Level {userLevel}
          </button>
        </div>
      </div>

      {activeTab === 'practice' && (
        <>
          {/* 1. Setup screen */}
          {!session && !report && (
            <div className="max-w-2xl mx-auto w-full glass-panel rounded-3xl p-6 md:p-8 border border-white/10 flex flex-col gap-6 text-left shadow-2xl relative">
              <div>
                <h2 className="text-lg font-bold text-white">Interview Settings</h2>
                <p className="text-gray-400 text-xs mt-1">Configure parameters to customize the AI prompt generation.</p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Interview Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="glass-input text-xs cursor-pointer focus:outline-none"
                  >
                    <option value="Technical Interview">Technical Practice (Coding / DSA)</option>
                    <option value="HR Interview">HR & Core Fitments</option>
                    <option value="System Design Interview">System Design Topologies</option>
                    <option value="Behavioral Interview">Behavioral STAR Scenario</option>
                    <option value="Mixed Interview">Mixed Combination (Tech + HR)</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Difficulty</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="glass-input text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="glass-input text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Questions</label>
                    <select
                      value={qCount}
                      onChange={(e) => setQCount(e.target.value)}
                      className="glass-input text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="5">5 Questions</option>
                      <option value="10">10 Questions</option>
                      <option value="15">15 Questions</option>
                      <option value="20">20 Questions</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartInterview}
                  disabled={startingSession}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transform hover:translate-y-[-1px] transition-all mt-4"
                >
                  {startingSession ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Start Simulation Session</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 2. Active Session Workspace */}
          {session && (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-6">
              {/* Progress & Timer stats bar */}
              <div className="flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-400" />
                  <span>Interactive Console: Question {questionNum} of {session.questionCount}</span>
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>

              {/* Terminal Frame */}
              <div className="bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col min-h-[300px]">
                <div className="bg-[#121824] px-4 py-2 flex items-center gap-1.5 border-b border-white/5">
                  <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
                  <span className="text-[10px] text-gray-500 ml-4 font-mono">practice_session.sh</span>
                </div>

                <div className="p-6 flex flex-col gap-6 flex-1 text-left font-mono">
                  {/* Dynamic Question Bubble */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">&gt;&gt; INTERVIEWER AI</span>
                    <p className="!text-gray-100 text-sm leading-relaxed">{currentQuestion}</p>
                  </div>

                  {/* Input Response Box */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">&gt;&gt; CANDIDATE RESPONSE</span>
                    <form onSubmit={handleSubmitAnswer} className="flex flex-col gap-3">
                      <div className="relative">
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Type or dictate your answer..."
                          rows="4"
                          className="w-full bg-[#0d1220] border border-white/10 rounded-xl p-4 text-xs font-mono text-gray-300 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                        />
                        <button
                          type="button"
                          onClick={toggleListening}
                          className={`absolute right-3 bottom-3 p-2 rounded-lg transition-colors ${
                            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-black/40 text-gray-400 hover:text-white'
                          }`}
                          title={isListening ? 'Stop recording' : 'Dictate answer'}
                        >
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingAnswer}
                        className="self-end bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl text-xs flex items-center gap-2 transition disabled:opacity-50"
                      >
                        {submittingAnswer ? (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Answer</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Evaluation Report */}
          {report && (
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-8 text-left">
              {/* Banner */}
              <div className="glass-panel rounded-3xl p-6 md:p-8 border border-emerald-500/20 bg-emerald-950/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">Evaluation Ready</span>
                  <h2 className="text-xl font-bold text-white mt-2">Mock Interview Feedback Report</h2>
                  <p className="text-xs text-gray-400 mt-1">AI detailed diagnostics, scores and learning paths.</p>
                </div>
                <button
                  onClick={() => setReport(null)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition focus:outline-none"
                >
                  Practice Again
                </button>
              </div>

              {/* Scoring breakdown cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-[#121824] border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Overall</span>
                  <h3 className="text-2xl font-black text-indigo-400 mt-1">{report.scores.overallScore}%</h3>
                </div>
                <div className="bg-[#121824] border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Technical</span>
                  <h3 className="text-2xl font-black text-emerald-400 mt-1">{report.scores.technicalAccuracy}%</h3>
                </div>
                <div className="bg-[#121824] border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Communication</span>
                  <h3 className="text-2xl font-black text-purple-400 mt-1">{report.scores.communication}%</h3>
                </div>
                <div className="bg-[#121824] border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Confidence</span>
                  <h3 className="text-2xl font-black text-amber-400 mt-1">{report.scores.confidence}%</h3>
                </div>
                <div className="bg-[#121824] border border-white/5 p-4 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide">Problem Solving</span>
                  <h3 className="text-2xl font-black text-cyan-400 mt-1">{report.scores.problemSolving}%</h3>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Key Strengths
                  </h3>
                  <ul className="flex flex-col gap-2 pl-4 list-disc text-xs text-gray-300">
                    {report.feedback.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                  </ul>
                </div>

                <div className="glass-panel rounded-2xl p-6 border border-white/5">
                  <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    Areas to Improve
                  </h3>
                  <ul className="flex flex-col gap-2 pl-4 list-disc text-xs text-gray-300">
                    {report.feedback.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                  </ul>
                </div>
              </div>

              {/* Learning recommendations path */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
                <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  Recommended Concepts & Learning resources
                </h3>
                
                <div className="flex flex-col gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Missed Concepts</span>
                    <p className="text-gray-300">{report.feedback.missedConcepts.join(', ')}</p>
                  </div>
                  <div className="border-t border-white/5 pt-3">
                    <span className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Recommended Resources</span>
                    <p className="text-gray-300">{report.feedback.learningResources.join(', ')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'history' && (
        <div className="max-w-3xl mx-auto w-full glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-6 text-left">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Past Simulation Logs</h2>
          {historyList.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">No interview sessions cataloged.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyList.map((hist) => (
                <div key={hist._id} className="bg-black/20 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-white">{hist.interviewType}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{hist.difficulty} Difficulty • {hist.questionCount} Questions</p>
                    <p className="text-[9px] text-gray-500 mt-1 font-mono">{new Date(hist.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-gray-500 uppercase tracking-wide block">Overall Score</span>
                    <span className="text-lg font-black text-indigo-400">{hist.scores?.overallScore || 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'leaderboard' && (
        <div className="max-w-2xl mx-auto w-full glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-6 text-left">
          <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Department Rankings & High Scores</h2>
          {leaderboardList.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-6">Rankings board is empty.</p>
          ) : (
            <div className="flex flex-col gap-3.5">
              {leaderboardList.map((rank, idx) => (
                <div key={idx} className="flex justify-between items-center bg-black/20 p-3.5 rounded-2xl border border-white/5 text-xs">
                  <div className="flex items-center gap-4">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0 ? 'bg-amber-400 text-black' :
                      idx === 1 ? 'bg-gray-300 text-black' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-white/5 text-gray-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <img
                        src={rank.student?.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(rank.student?.name || 'User')}&background=121824&color=fff`}
                        alt="Photo"
                        className="w-8 h-8 rounded-full border border-white/10 object-cover"
                      />
                      <div>
                        <h4 className="font-bold text-white">{rank.student?.name}</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">{rank.student?.department || 'General'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-indigo-300 text-sm">{rank.highestScore}%</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{rank.sessionsCompleted} practice runs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 text-left">
          {/* Level Dashboard Card */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-lg font-extrabold text-white">Experience Level {userLevel}</h3>
              <p className="text-xs text-gray-400 mt-1">You accumulated {experiencesPoints} XP from complete sessions!</p>
              
              {/* Progress bar to next level */}
              <div className="w-64 bg-white/5 h-2.5 rounded-full mt-4 overflow-hidden relative border border-white/5">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full shadow-glow"
                  style={{ width: `${(experiencesPoints % 500) / 5}%` }}
                />
              </div>
              <span className="text-[9px] text-gray-500 font-mono mt-1.5 block">{(experiencesPoints % 500)} / 500 XP to Level {userLevel + 1}</span>
            </div>
            
            <Award className="w-16 h-16 text-indigo-500/20 animate-pulse" />
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
            <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Unlocked Achievement Badges</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border flex items-center gap-4 transition-all ${
                    badge.unlocked 
                      ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-300' 
                      : 'bg-black/10 border-white/5 text-gray-500 opacity-60'
                  }`}
                >
                  <Trophy className={`w-8 h-8 flex-shrink-0 ${badge.unlocked ? 'text-amber-400' : 'text-gray-600'}`} />
                  <div>
                    <h4 className="text-xs font-bold text-white">{badge.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1">{badge.desc}</p>
                    <span className="text-[9px] font-bold mt-1.5 block uppercase tracking-wide">
                      {badge.unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockInterview;
