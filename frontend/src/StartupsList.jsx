// src/StartupsList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function StartupsList() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStartups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('startups')
        .select('id, name, email, website, linkedin, industry, tech_stack, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setStartups(data);
      }
      setLoading(false);
    };

    fetchStartups();
  }, []);

  if (loading) {
    return <div className="p-6">Loading startups...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Startups</h1>
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
              {['Name','Email','Website','LinkedIn','Industry','Tech Stack','Joined'].map((h) => (
                <th key={h} className="px-6 py-3 border-b text-left text-sm font-semibold text-gray-700">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {startups.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{s.name}</td>
                <td className="px-6 py-4 border-b">{s.email}</td>
                <td className="px-6 py-4 border-b">
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {new URL(s.website).hostname}
                  </a>
                </td>
                <td className="px-6 py-4 border-b">
                  <a href={s.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    LinkedIn
                  </a>
                </td>
                <td className="px-6 py-4 border-b">{s.industry}</td>
                <td className="px-6 py-4 border-b">{s.tech_stack}</td>
                <td className="px-6 py-4 border-b">{new Date(s.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
