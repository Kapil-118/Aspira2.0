import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Search,
  FileText,
  Bot,
  Calendar,
  AlertCircle,
  UserCheck,
  Briefcase,
  Cpu,
  Award
} from 'lucide-react';

const Sidebar = ({ isOpen }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Mentors', path: '/mentors', icon: Search },
    { name: 'Connections', path: '/connections', icon: UserCheck },
    { name: 'Chat Messages', path: '/chat', icon: MessageSquare },
    { name: 'Lost & Found', path: '/lostfound', icon: AlertCircle },
    { name: 'Resume Analyzer', path: '/resume', icon: FileText },
    { name: 'AI Chatbot', path: '/chatbot', icon: Bot },
    { name: 'Events Portal', path: '/events', icon: Calendar },
    { name: 'Placement Tracker', path: '/placement', icon: Briefcase },
    { name: 'AI Interview', path: '/interview', icon: Cpu },
    { name: 'Alumni Network', path: '/alumni', icon: Award }
  ];

  return (
    <aside className={`transition-all duration-300 border-r border-white/10 py-6 glass-panel ${
      isOpen 
        ? 'fixed top-[76px] bottom-0 left-0 z-30 w-64 px-4 bg-[#080B11]/95 backdrop-blur-md md:relative md:top-0 md:min-h-[calc(100vh-76px)] md:bg-transparent md:backdrop-blur-none md:block' 
        : 'hidden md:block md:relative md:w-20 md:px-2 md:min-h-[calc(100vh-76px)]'
    }`}>
      <div className="flex flex-col gap-1.5">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            title={!isOpen ? item.name : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                isOpen ? 'px-4 justify-start' : 'px-0 justify-center'
              } ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-glow'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {isOpen && <span className="truncate">{item.name}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
