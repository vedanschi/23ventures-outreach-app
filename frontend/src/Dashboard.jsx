// src/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FaUsers, FaEnvelope, FaEye, FaUpload, FaUserPlus, FaPaperPlane } from 'react-icons/fa';
import './App.css';

export default function Dashboard({ session }) {
  const [stats, setStats] = useState({
    startups: 0,
    emails: 0,
    viewed: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentEmails, setRecentEmails] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Fetch startup count
        const { count: startupsCount, error: startupsError } = await supabase
          .from('startups')
          .select('*', { count: 'exact', head: true });
        
        if (startupsError) throw startupsError;
        
        // Fetch email count
        const { count: emailsCount, error: emailsError } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true });
        
        if (emailsError) throw emailsError;
        
        // Fetch viewed email count
        const { count: viewedCount, error: viewedError } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true })
          .eq('viewed', true);
        
        if (viewedError) throw viewedError;
        
        // Fetch recent emails
        const { data: recentEmailsData, error: recentEmailsError } = await supabase
          .from('emails')
          .select(`
            id,
            subject,
            sent_at,
            viewed,
            startup: startups(name)
          `)
          .order('sent_at', { ascending: false })
          .limit(5);
        
        if (recentEmailsError) throw recentEmailsError;
        
        setStats({
          startups: startupsCount || 0,
          emails: emailsCount || 0,
          viewed: viewedCount || 0
        });
        
        setRecentEmails(recentEmailsData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary-purple">Welcome to 23Ventures Outreach</h1>
        <p className="text-neutral-600">Manage your startup outreach campaigns from one place</p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-purple"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="dashboard-card bg-white rounded-lg shadow-md p-6 border-t-4 border-primary-purple">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700 mb-1">Startups</h2>
                  <p className="text-3xl font-bold text-primary-purple">{stats.startups}</p>
                  <p className="mt-2 text-neutral-600 text-sm">Total startups in database</p>
                </div>
                <div className="bg-primary-purple bg-opacity-10 p-3 rounded-full">
                  <FaUsers className="h-6 w-6 text-primary-purple" />
                </div>
              </div>
              <Link to="/startups" className="mt-4 inline-block text-primary-purple hover:underline text-sm font-medium">
                View all startups →
              </Link>
            </div>
            
            <div className="dashboard-card bg-white rounded-lg shadow-md p-6 border-t-4 border-accent-blue">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700 mb-1">Emails Sent</h2>
                  <p className="text-3xl font-bold text-accent-blue">{stats.emails}</p>
                  <p className="mt-2 text-neutral-600 text-sm">Total emails sent to startups</p>
                </div>
                <div className="bg-accent-blue bg-opacity-10 p-3 rounded-full">
                  <FaEnvelope className="h-6 w-6 text-accent-blue" />
                </div>
              </div>
              <Link to="/send" className="mt-4 inline-block text-accent-blue hover:underline text-sm font-medium">
                Send more emails →
              </Link>
            </div>
            
            <div className="dashboard-card bg-white rounded-lg shadow-md p-6 border-t-4 border-accent-green">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700 mb-1">Emails Viewed</h2>
                  <p className="text-3xl font-bold text-accent-green">{stats.viewed}</p>
                  <p className="mt-2 text-neutral-600 text-sm">Emails opened by recipients</p>
                </div>
                <div className="bg-accent-green bg-opacity-10 p-3 rounded-full">
                  <FaEye className="h-6 w-6 text-accent-green" />
                </div>
              </div>
              <Link to="/emails" className="mt-4 inline-block text-accent-green hover:underline text-sm font-medium">
                View email history →
              </Link>
            </div>
          </div>
          
          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-neutral-800">Quick Actions</h2>
              <div className="flex flex-col gap-3">
                <Link to="/upload" className="flex items-center p-3 bg-primary-purple text-white rounded-md hover:bg-primary-purple-light transition-colors">
                  <FaUpload className="mr-2" />
                  Upload Startup CSV
                </Link>
                <Link to="/startups" className="flex items-center p-3 bg-accent-blue text-white rounded-md hover:bg-blue-600 transition-colors">
                  <FaUserPlus className="mr-2" />
                  Add New Startup
                </Link>
                <Link to="/send" className="flex items-center p-3 bg-accent-green text-white rounded-md hover:bg-green-600 transition-colors">
                  <FaPaperPlane className="mr-2" />
                  Send Outreach Emails
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-neutral-800">Recent Activity</h2>
              {recentEmails.length > 0 ? (
                <div className="space-y-3">
                  {recentEmails.map((email) => (
                    <div key={email.id} className="p-3 border-b border-neutral-200 last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-neutral-800">{email.subject}</p>
                          <p className="text-sm text-neutral-600">To: {email.startup?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex items-center">
                          {email.viewed ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Viewed</span>
                          ) : (
                            <span className="text-xs bg-neutral-100 text-neutral-800 px-2 py-1 rounded-full">Sent</span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(email.sent_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600">
                  No recent activity to display. Start by adding startups or sending emails.
                </p>
              )}
              
              <div className="mt-4 text-right">
                <Link to="/emails" className="text-primary-purple hover:underline text-sm font-medium">
                  View all activity →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
