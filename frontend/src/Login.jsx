// src/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FaGithub, FaEnvelope, FaLock, FaSignInAlt } from 'react-icons/fa';
import './App.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-purple">23Ventures</h1>
          <p className="text-neutral-600 mt-2">Outreach Platform</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-primary-purple">
          <h2 className="text-2xl font-bold mb-6 text-center text-neutral-800">Welcome Back</h2>

          {errorMsg && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="email"
                className="w-full pl-10 p-3 border rounded focus:border-primary-purple focus:ring focus:ring-primary-purple-light focus:ring-opacity-50"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="h-5 w-5 text-neutral-500" />
              </div>
              <input
                type="password"
                className="w-full pl-10 p-3 border rounded focus:border-primary-purple focus:ring focus:ring-primary-purple-light focus:ring-opacity-50"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-purple text-white rounded hover:bg-primary-purple-light transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Log In
                </>
              )}
            </button>
          </form>

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-neutral-300"></div>
            <span className="flex-shrink mx-4 text-neutral-500">or</span>
            <div className="flex-grow border-t border-neutral-300"></div>
          </div>

          <button
            onClick={handleGitHub}
            type="button"
            className="w-full flex items-center justify-center gap-2 py-3 bg-neutral-800 text-white rounded hover:bg-neutral-900 transition-colors"
          >
            <FaGithub className="h-5 w-5" aria-hidden="true" />
            <span>Sign in with GitHub</span>
          </button>

          <p className="mt-6 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary-purple hover:underline font-medium">
              Sign Up
            </a>
          </p>
        </div>

        <p className="text-center text-xs text-neutral-500 mt-8">
          © 2025 23Ventures. All rights reserved.
        </p>
      </div>
    </div>
  );
}
