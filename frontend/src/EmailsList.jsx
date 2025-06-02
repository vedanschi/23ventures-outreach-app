// src/EmailsList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope, FaEye, FaRegClock } from 'react-icons/fa';
import './App.css';

export default function EmailsList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      try {
        // First, check if the emails table exists and has data
        const { data: emailsCheck, error: emailsError } = await supabase
          .from('emails')
          .select('*')
          .limit(5);

        if (emailsError) {
          setError(`Error accessing emails table: ${emailsError.message}`);
          setLoading(false);
          return;
        }

        // Try a simpler query first without the join
        const { data, error } = await supabase
          .from('emails')
          .select('*')
          .order('sent_at', { ascending: false });

        if (error) {
          setError(`Error fetching emails: ${error.message}`);
        } else if (!data || data.length === 0) {
          setEmails([]);
        } else {
          // For each email, fetch the startup details separately
          const emailsWithStartups = await Promise.all(
            data.map(async (email) => {
              if (email.startup_id) {
                const { data: startup, error: startupError } = await supabase
                  .from('startups')
                  .select('name, email')
                  .eq('id', email.startup_id)
                  .single();

                if (startupError || !startup) {
                  return { ...email, startup: { name: 'Unknown', email: 'unknown@example.com' } };
                }

                return { ...email, startup };
              } else {
                return { ...email, startup: { name: 'Unknown', email: 'unknown@example.com' } };
              }
            })
          );

          setEmails(emailsWithStartups);
        }
      } catch (err) {
        setError(`An unexpected error occurred: ${err.message}`);
      }
      setLoading(false);
    };

    fetchEmails();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-purple">Email History</h1>
          <p className="text-neutral-600">Track all emails sent to startups</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-purple"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaEnvelope className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No Emails Sent Yet</h2>
          <p className="text-neutral-600 mb-4">Start reaching out to startups to see your email history here.</p>
          <button
            onClick={() => navigate('/send')}
            className="px-4 py-2 bg-primary-purple text-white rounded-md hover:bg-primary-purple-light transition-colors"
          >
            Send Your First Email
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  {['To', 'Subject', 'Type', 'Sent At', 'Status'].map((header) => (
                    <th
                      key={header}
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {emails.map((email) => (
                  <tr key={email.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{email.startup.name}</div>
                      <div className="text-sm text-neutral-500">{email.startup.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-900">{email.subject || 'No subject'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        email.follow_up
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {email.follow_up ? 'Follow-Up' : 'Initial'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      <div className="flex items-center">
                        <FaRegClock className="mr-2 text-neutral-400" />
                        {email.sent_at ? new Date(email.sent_at).toLocaleString() : 'Unknown date'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {email.viewed ? (
                        <div className="flex items-center text-green-600">
                          <FaEye className="mr-2" />
                          <span>Viewed</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500">Not viewed yet</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
