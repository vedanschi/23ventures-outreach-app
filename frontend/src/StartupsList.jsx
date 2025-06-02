// src/StartupsList.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaPlus, FaExternalLinkAlt, FaLinkedin, FaSpinner } from 'react-icons/fa';
import './App.css';

export default function StartupsList() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStartup, setNewStartup] = useState({
    name: '',
    email: '',
    website: '',
    linkedin: '',
    industry: '',
    tech_stack: ''
  });
  const [addingStartup, setAddingStartup] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('startups')
      .select('id, name, email, website, linkedin, industry, tech_stack, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      setMessageType('error');
    } else {
      setStartups(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStartup(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!newStartup.name.trim()) return "Name is required";
    if (!newStartup.email.trim()) return "Email is required";
    if (!newStartup.email.includes('@')) return "Email is invalid";

    // Basic URL validation
    if (newStartup.website && !newStartup.website.startsWith('http')) {
      return "Website must start with http:// or https://";
    }
    if (newStartup.linkedin && !newStartup.linkedin.startsWith('http')) {
      return "LinkedIn URL must start with http:// or https://";
    }

    return null;
  };

  const handleAddStartup = async (e) => {
    e.preventDefault();

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      setMessageType('error');
      return;
    }

    setAddingStartup(true);
    setMessage('');

    try {
      // Ensure URLs have proper format
      const formattedStartup = {
        ...newStartup,
        website: newStartup.website || 'https://example.com',
        linkedin: newStartup.linkedin || 'https://linkedin.com/company/example'
      };

      const { data, error } = await supabase
        .from('startups')
        .insert([formattedStartup])
        .select();

      if (error) throw error;

      // Success - update the UI
      setStartups(prev => [data[0], ...prev]);
      setMessage('Startup added successfully!');
      setMessageType('success');
      setNewStartup({
        name: '',
        email: '',
        website: '',
        linkedin: '',
        industry: '',
        tech_stack: ''
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding startup:', err);
      setMessage(`Error: ${err.message}`);
      setMessageType('error');
    } finally {
      setAddingStartup(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-purple">Startups</h1>
          <p className="text-neutral-600">Manage your startup database</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded-md flex items-center ${
              showAddForm
                ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                : 'bg-primary-purple text-white hover:bg-primary-purple-light'
            }`}
          >
            {showAddForm ? 'Cancel' : (
              <>
                <FaPlus className="mr-2" />
                Add Startup
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-md ${
          messageType === 'success'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="mb-6 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">Add New Startup</h2>
          <form onSubmit={handleAddStartup}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newStartup.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={newStartup.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={newStartup.website}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={newStartup.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/company/example"
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  name="industry"
                  value={newStartup.industry}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Tech Stack
                </label>
                <input
                  type="text"
                  name="tech_stack"
                  value={newStartup.tech_stack}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:ring focus:ring-primary-purple-light focus:border-primary-purple"
                />
              </div>
            </div>

            <div className="mt-4">
              <button
                type="submit"
                disabled={addingStartup}
                className="px-4 py-2 bg-primary-purple text-white rounded-md hover:bg-primary-purple-light disabled:opacity-50 flex items-center"
              >
                {addingStartup ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  <>
                    <FaPlus className="mr-2" />
                    Add Startup
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-purple"></div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-100 text-red-700 rounded-md border border-red-300">
          Error: {error}
        </div>
      ) : startups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <FaUsers className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">No Startups Yet</h2>
          <p className="text-neutral-600 mb-4">Add your first startup to get started.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary-purple text-white rounded-md hover:bg-primary-purple-light transition-colors"
          >
            <FaPlus className="inline mr-2" />
            Add Your First Startup
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  {['Name','Email','Website','LinkedIn','Industry','Tech Stack','Joined'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {startups.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-neutral-900">{s.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{s.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.website && (
                        <a
                          href={s.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-blue hover:underline flex items-center text-sm"
                        >
                          {new URL(s.website).hostname}
                          <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.linkedin && (
                        <a
                          href={s.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent-blue hover:underline flex items-center text-sm"
                        >
                          <FaLinkedin className="mr-1" />
                          LinkedIn
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{s.industry || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-neutral-500">{s.tech_stack || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {new Date(s.created_at).toLocaleDateString()}
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
