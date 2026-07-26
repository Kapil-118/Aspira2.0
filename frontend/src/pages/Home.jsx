import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ShieldCheck, MessageSquare, Award, ArrowRight, Zap, Target, BookOpen } from 'lucide-react';

const Home = () => {
  return (
    <div className="bg-[#080B11] text-gray-100 min-h-screen flex flex-col justify-between">
      {/* Decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Banner Navigation */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <img
            src="/logo.jpg"
            alt="Aspira logo"
            className="w-8 h-8 rounded-lg object-cover shadow-glow"
          />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
            Aspira
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-gray-400 hover:text-white transition text-sm font-medium">Login</Link>
          <Link
            to="/register"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-glow transform hover:translate-y-[-1px] transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 md:py-24 z-10 flex-1 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-indigo-300 mb-6 animate-pulse">
          <Zap className="w-3.5 h-3.5" />
          <span>Empowering Academic Mentorship</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-tight max-w-4xl mb-6">
          Bridge the Gap Between <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Seniors & Juniors
          </span>
        </h1>

        <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mb-10 leading-relaxed">
          Aspira is a centralized campus portal enabling structured mentorship, real-time messaging, WebRTC calling, PDF resume reviews, and community assistance.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            to="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-4 rounded-xl font-bold shadow-glass shadow-indigo-500/10 transform hover:scale-[1.02] transition-all"
          >
            <span>Start Collaborating</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 px-8 py-4 rounded-xl font-bold transition-all"
          >
            Explore Platform
          </Link>
        </div>

        {/* Feature Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full mt-8">
          <div className="glass-card rounded-2xl p-6 text-left">
            <div className="bg-indigo-600/20 text-indigo-400 p-3 rounded-xl w-fit mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-2">Mentor Directory</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Find experienced seniors filtered by department, skills matrices, and graduation year parameters.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left">
            <div className="bg-purple-600/20 text-purple-400 p-3 rounded-xl w-fit mb-4">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-2">Real-time Sockets</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Communicate instantly with typing feedback, online status bubbles, seen logs, and video invites.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left">
            <div className="bg-pink-600/20 text-pink-400 p-3 rounded-xl w-fit mb-4">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-2">AI Resume Analyzer</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Upload resume PDF files to automatically verify key missing headers, bullet improvements, and summary sheets.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 text-left">
            <div className="bg-emerald-600/20 text-emerald-400 p-3 rounded-xl w-fit mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-gray-200 mb-2">Lost & Found Board</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Post lost or found belongings locally, upload matching item images, and search geo-locations easily.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-gray-500 text-xs z-10 mt-12">
        <p>© {new Date().getFullYear()} Aspira Platform. All rights reserved.</p>
        <div className="flex items-center gap-6 mt-4 sm:mt-0">
          <a href="#" className="hover:text-white transition">About Us</a>
          <a href="#" className="hover:text-white transition">Campus Services</a>
          <a href="#" className="hover:text-white transition">Privacy Policy</a>
        </div>
      </footer>
    </div>
  );
};

export default Home;
