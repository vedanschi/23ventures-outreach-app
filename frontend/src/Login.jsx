// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FaGithub } from 'react-icons/fa';
import './App.css'; 

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    navigate('/dashboard');
  };

  const handleGitHub = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: { 
      redirectTo: `${window.location.origin}/dashboard`,
      // Make sure this exact URL is in your Supabase allowed redirect URLs
    }
  });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
        {errorMsg && (
          <p className="text-red-500 mb-4" role="alert">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            className="w-full p-3 border rounded"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="w-full p-3 border rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log In
          </button>
        </form>

        <div className="my-4 text-center text-gray-500">or</div>

        <button
          onClick={handleGitHub}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 text-white rounded hover:bg-gray-900"
        >
          <FaGithub className="h-5 w-5" aria-hidden="true" />
          <span>Sign in with GitHub</span>
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{' '}
          <a href="/signup" className="text-blue-600 hover:underline">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  );
}
