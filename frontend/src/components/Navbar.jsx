import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, MessageSquare, Compass, Bell, Menu, Sun, Moon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

import { getMediaUrl } from '../utils/media';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem('aspira_theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('aspira_theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 w-full glass-panel z-40 px-6 py-4 flex items-center justify-between border-b border-white/10 shadow-lg">
      <div className="flex items-center gap-4">
        {user && (
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-darkBg/50 rounded-xl transition focus:outline-none"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <Link to="/dashboard" className="flex items-center gap-2 group">
          <img
            src="/logo.jpg"
            alt="Aspira logo"
            className="w-8 h-8 rounded-lg object-cover transform group-hover:scale-105 transition-all shadow-glow"
          />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent">
            Aspira
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            {/* Quick Links */}
            <div className="hidden md:flex items-center gap-6 text-sm">
              <Link to="/mentors" className="text-gray-400 hover:text-indigo-400 transition">Directory</Link>
              <Link to="/chat" className="text-gray-400 hover:text-indigo-400 transition">Messages</Link>
              <Link to="/lostfound" className="text-gray-400 hover:text-indigo-400 transition">Lost & Found</Link>
              <Link to="/events" className="text-gray-400 hover:text-indigo-400 transition">Events</Link>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 text-gray-400 hover:text-indigo-400 rounded-xl hover:bg-white/5 transition focus:outline-none"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              <NotificationBell />

              <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>

              {/* User Dropdown / Meta */}
              <div className="flex items-center gap-3">
                <Link to="/profile" className="flex items-center gap-2.5 group">
                  {user.profilePhoto ? (
                    <img
                      src={getMediaUrl(user.profilePhoto)}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-indigo-500/30 group-hover:border-indigo-500/70 transition"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 font-semibold group-hover:border-indigo-500/70 transition">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-200 group-hover:text-indigo-400 transition">{user.name}</p>
                    <p className="text-[10px] text-gray-500 capitalize">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all focus:outline-none"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4 text-sm font-medium">
            <Link to="/login" className="text-gray-300 hover:text-indigo-400 transition">Login</Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg shadow-md transition-all"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
