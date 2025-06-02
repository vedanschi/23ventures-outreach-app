// src/SendEmails.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaPaperPlane, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { API_BASE_URL, API_ENDPOINTS } from './api/config';
import './App.css';

export default function SendEmails() {
  const [startups, setStartups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [emailType, setEmailType] = useState('outreach'); // 'outreach' or 'followup'
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch startup info for emailing
    setLoading(true);
    supabase
      .from('startups')
      .select('id, name, email, industry')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setMessage(`Error loading startups: ${error.message}`);
          setMessageType('error');
        } else {
          setStartups(data || []);
        }
        setLoading(false);
      });
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === startups.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(startups.map(s => s.id)));
    }
  };

  const sendEmails = async () => {
    setSending(true);
    setMessage('');
    setMessageType('');
    
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
          previous_interaction: 'Initial email sent you.', // for followup
          startup_id: s.id
        }));

      // Send each email sequentially (or batch as desired)
      for (const payload of payloadList) {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEND_EMAIL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Send failed');
      }
      
      setMessage(`Successfully sent ${payloadList.length} emails.`);
      setMessageType('success');
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-purple">Send Emails</h1>
          <p className="text-neutral-600">Reach out to startups in your database</p>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          messageType === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          <div className="flex items-center">
            {messageType === 'success' ? (
              <FaCheck className="mr-2" />
            ) : (
              <FaExclamationTriangle className="mr-2" />
            )}
            {message}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-neutral-700 font-medium mb-2">Email Type:</label>
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-primary-purple"
                name="emailType"
                value="outreach"
                checked={emailType === 'outreach'}
                onChange={() => setEmailType('outreach')}
              />
              <span className="ml-2">Initial Outreach</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className="form-radio text-accent-blue"
                name="emailType"
                value="followup"
                checked={emailType === 'followup'}
                onChange={() => setEmailType('followup')}
              />
              <span className="ml-2">Follow-Up</span>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-purple"></div>
        </div>
      ) : startups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaPaperPlane className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No Startups Available</h2>
          <p className="text-neutral-600 mb-4">Add startups to your database before sending emails.</p>
          <button 
            onClick={() => navigate('/upload')} 
            className="px-4 py-2 bg-primary-purple text-white rounded-md hover:bg-primary-purple-light transition-colors"
          >
            Upload Startups CSV
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-primary-purple rounded"
                  checked={selectedIds.size === startups.length && startups.length > 0}
                  onChange={toggleSelectAll}
                />
                <span className="ml-2 text-neutral-700 font-medium">
                  {selectedIds.size} of {startups.length} selected
                </span>
              </div>
              <button
                onClick={sendEmails}
                disabled={sending || selectedIds.size === 0}
                className={`px-4 py-2 rounded-md flex items-center ${
                  sending || selectedIds.size === 0
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-primary-purple text-white hover:bg-primary-purple-light'
                }`}
              >
                {sending ? 'Sending...' : `Send ${selectedIds.size} Email(s)`}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <table className="min-w-full">
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
                        className="form-checkbox h-5 w-5 text-primary-purple rounded"
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
          </div>
        </>
      )}

      <div className="mt-4">
        <button onClick={() => navigate('/dashboard')} className="text-gray-600 underline">
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}