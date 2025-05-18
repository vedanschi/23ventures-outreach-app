// src/App.jsx
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import SignUp from './SignUp';
import Login  from './Login';
import Dashboard from './Dashboard'; // your authenticated view
import UploadCsv from './UploadCsv';
import SendEmails from './SendEmails';
import StartupsList from './StartupsList';
import EmailsList from './EmailsList';
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <nav>
        {!session ? (
          <>
            <Link to="/login">Log In</Link> | <Link to="/signup">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard">Dashboard</Link> | 
            <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </>
        )}
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to={session ? "/dashboard" : "/login"} />} />
        <Route path="/signup" element={!session ? <SignUp /> : <Navigate to="/dashboard" />} />
        <Route path="/login"  element={!session ? <Login /> : <Navigate to="/dashboard" />} />
        <Route
          path="/dashboard"
          element={session ? <Dashboard session={session} /> : <Navigate to="/login" />}
        />
        <Route path="/upload" element={<UploadCsv />} />
        <Route path="/startups" element={<StartupsList />} />
        <Route path="/send" element={<SendEmails />} />
        <Route path="/emails" element={<EmailsList />} />
      </Routes>
    </div>
  );
}

export default App;
