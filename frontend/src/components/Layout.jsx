
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-purple-700 px-6 py-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/dashboard" className="text-white text-3xl font-extrabold">
            23Ventures Outreach
          </Link>
          <nav className="flex space-x-8">
            {[
              { to: '/dashboard', label: 'Dashboard' },
              { to: '/startups', label: 'Startups' },
              { to: '/send', label: 'Send Emails' },
              { to: '/emails', label: 'Email History' }
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-white transition-colors duration-200 hover:text-green-300 ${
                  isActive(to) ? 'underline decoration-blue-300' : ''
                }`}
              >
                {label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="text-white transition-colors duration-200 hover:text-green-300"
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-6 py-10">
        {children}
      </main>
      <footer className="bg-green-800 text-white py-6">
        <div className="container mx-auto text-center text-sm opacity-90">
          © 2025 23Ventures. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
