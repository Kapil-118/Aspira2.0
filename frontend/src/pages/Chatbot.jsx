import React, { useState, useRef, useEffect, useContext } from 'react';
import { Send, Bot, Sparkles, MessageCircle, HelpCircle } from 'lucide-react';
import API from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Chatbot = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: `Hello ${user.name}! I am your Aspira Career Assistant. Ask me anything about matching skills, resume optimization guidelines, directory searching, or workshop scheduling!`
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() || loading) return;

    const userText = inputVal;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await API.post('/ai/chatbot', { question: userText });
      if (res.data.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: res.data.answer }]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { sender: 'ai', text: 'I am experiencing server connection issues. Please try again shortly!' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    "How can I request connection with a mentor?",
    "How do I create a report in Lost & Found?",
    "What details should be included in my resume?",
    "How do MERN stack socket connections work?"
  ];

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] text-left relative">
      
      {/* Left panel: Sample questions prompts list */}
      <div className="w-80 glass-panel rounded-2xl p-5 border border-white/5 hidden lg:flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <HelpCircle className="w-5 h-5 text-indigo-400" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400">Sample Prompts</h3>
        </div>
        
        <div className="flex flex-col gap-2.5">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setInputVal(p)}
              className="w-full p-3 rounded-xl border border-white/5 bg-darkBg/30 text-xs text-gray-400 hover:text-indigo-400 hover:border-indigo-500/30 text-left leading-relaxed transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Right panel: Active Bot panel */}
      <div className="flex-1 glass-panel rounded-2xl border border-white/5 flex flex-col justify-between overflow-hidden">
        {/* Header bar */}
        <div className="px-6 py-4 bg-darkCard/50 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20 shadow-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>Aspira Assistant</span>
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              </h3>
              <p className="text-[10px] text-gray-500">Instant AI Career advisor & help Desk</p>
            </div>
          </div>
        </div>

        {/* Message logs scroll zone */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {messages.map((m, idx) => {
            const isBot = m.sender === 'ai';
            return (
              <div
                key={idx}
                className={`flex gap-3 max-w-[75%] ${isBot ? 'self-start items-start' : 'self-end items-end flex-row-reverse'}`}
              >
                {isBot && (
                  <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 text-xs">
                    AI
                  </div>
                )}
                <div className="flex flex-col">
                  <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed text-left ${
                    isBot 
                      ? 'bg-darkCard text-gray-300 rounded-tl-none border border-white/5' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="self-start flex gap-3 items-center text-gray-500 text-xs animate-pulse">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">
                AI
              </div>
              <span>Formulating guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input submission container */}
        <form onSubmit={handleSubmit} className="p-4 bg-darkCard/30 border-t border-white/5 flex gap-3 items-center">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 glass-input text-xs py-3"
            placeholder="Ask AI Career assistant about profiles, code, resume structures..."
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Chatbot;
