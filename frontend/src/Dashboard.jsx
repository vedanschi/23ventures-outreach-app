// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function Dashboard() {
  const [session, setSession] = useState(null);
  const [startups, setStartups] = useState([]);
  const [emails, setEmails] = useState([]);
  const navigate = useNavigate();

  // Fetch session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      } else {
        setSession(session);
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      } else {
        setSession(session);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  // Fetch counts
  useEffect(() => {
    if (!session) return;
    const fetchCounts = async () => {
      const { data: startupsData, error: sError } = await supabase
        .from('startups')
        .select('id');
      if (sError) console.error('Error fetching startups:', sError.message);
      else setStartups(startupsData || []);

      const { data: emailsData, error: eError } = await supabase
        .from('emails')
        .select('id');
      if (eError) console.error('Error fetching emails:', eError.message);
      else setEmails(emailsData || []);
    };
    fetchCounts();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">23Ventures Outreach Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Sign Out
        </button>
      </header>

      <section className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-lg font-semibold">Total Startups</h2>
          <p className="text-3xl mt-2">{startups.length}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-lg font-semibold">Emails Generated</h2>
          <p className="text-3xl mt-2">{emails.length}</p>
        </div>
        <div className="p-4 bg-gray-100 rounded shadow">
          <h2 className="text-lg font-semibold">Upcoming Follow-ups</h2>
          <p className="text-3xl mt-2">
            {emails.filter(e => e.follow_up).length}
          </p>
        </div>
      </section>

      <section className="space-x-4">
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-3 bg-blue-600 text-white rounded"
        >
          Upload CSV
        </button>
        <button
          onClick={() => navigate('/startups')}
          className="px-6 py-3 bg-green-600 text-white rounded"
        >
          View Startups
        </button>
        <button
          onClick={() => navigate('/emails')}
          className="px-6 py-3 bg-indigo-600 text-white rounded"
        >
          View Emails
        </button>
        <button
          onClick={() => navigate('/send')}
          className="px-6 py-3 bg-purple-600 text-white rounded"
        >
          Send Emails
        </button>
      </section>
    </div>
  );
}
