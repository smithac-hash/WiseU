import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import NotificationBell from './NotificationBell';

import { User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Budgets', path: '/budgets', icon: '💰' },
    { name: 'Calendar', path: '/calendar', icon: '📅' },
    { name: 'Insights', path: '/insights', icon: '✨' },
    { name: 'Memory', path: '/memory-graph', icon: '🧠' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
            WiseU 🎓
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.path 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="mr-1.5">{link.icon}</span>
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="hidden sm:flex flex-col items-end group">
              <span className="text-sm font-bold text-gray-800 group-hover:text-primary transition-colors">{user?.name}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider group-hover:text-primary transition-colors">Student</span>
            </Link>
            <Link 
              to="/profile" 
              className={`p-2 rounded-lg transition-all ${
                location.pathname === '/profile' 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-400 hover:bg-gray-50 hover:text-primary'
              }`}
            >
              <User className="w-5 h-5" />
            </Link>
            <button 
              onClick={logout}
              className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 rounded-lg transition-all"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
