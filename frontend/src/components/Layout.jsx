
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Layout({ children }) {
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <div className="app-container">
      <header className="bg-purple p-4 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-white text-xl font-bold">23Ventures Outreach</h1>
          <nav className="flex gap-4">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
            <Link to="/startups" className={`nav-link ${isActive('/startups') ? 'active' : ''}`}>Startups</Link>
            <Link to="/send" className={`nav-link ${isActive('/send') ? 'active' : ''}`}>Send Emails</Link>
            <Link to="/emails" className={`nav-link ${isActive('/emails') ? 'active' : ''}`}>Email History</Link>
            <button onClick={() => supabase.auth.signOut()} className="nav-link">Sign Out</button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {children}
      </main>
      <footer className="bg-neutral-800 text-white p-4 mt-8">
        <div className="container mx-auto text-center">
          <p>© 2023 23Ventures. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}