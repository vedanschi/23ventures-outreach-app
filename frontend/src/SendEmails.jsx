// src/SendEmails.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import './App.css';

export default function SendEmails() {
  const [startups, setStartups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [emailType, setEmailType] = useState('outreach'); // 'outreach' or 'followup'
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch startup info for emailing
    supabase
      .from('startups')
      .select('id, name, email, industry')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error(error);
        else setStartups(data);
      });
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const sendEmails = async () => {
    setSending(true);
    setMessage('');
    try {
      // Build list of selected startup details
      const payloadList = startups
        .filter((s) => selectedIds.has(s.id))
        .map((s) => ({
          type: emailType,
          company_name: s.name,
          recipient_name: s.name,
          recipient_email: s.email,
          product_description: s.industry,          // for outreach
          previous_interaction: 'Initial email sent you.' // for followup
        }));

      // Send each email sequentially (or batch as desired)
      for (const payload of payloadList) {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Send failed');
      }
      setMessage(`Successfully sent ${payloadList.length} emails.`);
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Send Emails</h1>

      <div className="mb-4">
        <label className="mr-2">Type:</label>
        <select
          value={emailType}
          onChange={(e) => setEmailType(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="outreach">Outreach</option>
          <option value="followup">Follow-Up</option>
        </select>
      </div>

      <table className="min-w-full bg-white rounded shadow mb-4">
        <thead>
          <tr>
            <th />
            <th>Name</th>
            <th>Email</th>
            <th>Industry</th>
          </tr>
        </thead>
        <tbody>
          {startups.map((s) => (
            <tr key={s.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.has(s.id)}
                  onChange={() => toggleSelect(s.id)}
                />
              </td>
              <td>{s.name}</td>
              <td>{s.email}</td>
              <td>{s.industry}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {message && <p className="mb-2">{message}</p>}

      <button
        onClick={sendEmails}
        disabled={sending || selectedIds.size === 0}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {sending ? 'Sending...' : `Send ${selectedIds.size} Email(s)`}
      </button>

      <div className="mt-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-600 underline">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}