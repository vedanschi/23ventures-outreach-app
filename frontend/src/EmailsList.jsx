// src/EmailsList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function EmailsList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('emails')
        .select(`
          id,
          subject,
          follow_up,
          sent_at,
          startup: startups(name, email)
        `)
        .order('sent_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setEmails(data);
      }
      setLoading(false);
    };

    fetchEmails();
  }, []);

  if (loading) return <div className="p-6">Loading emails...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Sent Emails</h1>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Back to Dashboard
        </button>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr>
              {['To','Subject','Type','Sent At'].map((h) => (
                <th key={h} className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {emails.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{e.startup.name} &lt;{e.startup.email}&gt;</td>
                <td className="px-6 py-4 border-b">{e.subject}</td>
                <td className="px-6 py-4 border-b">{e.follow_up ? 'Follow-Up' : 'Initial'}</td>
                <td className="px-6 py-4 border-b">{new Date(e.sent_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
