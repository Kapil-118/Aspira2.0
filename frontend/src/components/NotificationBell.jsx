import React, { useContext, useState, useRef, useEffect } from 'react';
import { Bell, CheckSquare } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';

const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-indigo-400 hover:bg-darkBg/50 rounded-full transition-all focus:outline-none"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 glass-panel rounded-xl shadow-glass border border-white/10 z-50 overflow-hidden transform origin-top-right transition-all">
          <div className="flex items-center justify-between px-4 py-3 bg-darkCard/80 border-b border-white/5">
            <h3 className="font-semibold text-gray-200 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-xs">
                No recent notifications.
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id || Math.random()}
                  className={`px-4 py-3 border-b border-white/5 flex flex-col gap-1 transition ${
                    !n.isRead ? 'bg-indigo-500/5 hover:bg-indigo-500/10' : 'hover:bg-white/5'
                  }`}
                >
                  <p className="text-xs text-gray-300">{n.text}</p>
                  <span className="text-[10px] text-gray-500 self-end">
                    {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
