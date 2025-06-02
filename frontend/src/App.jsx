// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SignUp from './SignUp';
import Login  from './Login';
import Dashboard from './Dashboard';
import UploadCsv from './UploadCsv';
import SendEmails from './SendEmails';
import StartupsList from './StartupsList';
import EmailsList from './EmailsList';
import Layout from './components/Layout';
import { supabase } from './supabaseClient';
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // This function handles the OAuth redirect and session retrieval
    const handleAuthSession = async () => {
      setLoading(true);

      // Check if we have a hash in the URL (sign of OAuth redirect)
      if (location.hash && location.hash.includes('access_token')) {
        console.log('OAuth redirect detected');
      }

      try {
        // Get the current session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Session data:', data);
          setSession(data.session);
        }
      } catch (error) {
        console.error('Error in auth flow:', error);
      } finally {
        setLoading(false);
      }
    };

    handleAuthSession();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('Auth state changed:', event);
        setSession(currentSession);
      }
    );

    // Cleanup the subscription when component unmounts
    return () => subscription.unsubscribe();
  }, [location]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary-purple mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading 23Ventures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app min-h-screen bg-neutral-100">
      {!session ? (
        // Auth routes without layout
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      ) : (
        // Protected routes with layout
        <Layout session={session}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard session={session} />} />
            <Route path="/upload" element={<UploadCsv />} />
            <Route path="/startups" element={<StartupsList />} />
            <Route path="/send" element={<SendEmails />} />
            <Route path="/emails" element={<EmailsList />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Layout>
      )}
    </div>
  );
}

export default App;
