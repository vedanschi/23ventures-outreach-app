// src/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FaGithub, FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
// import "./App.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
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

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHub = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
  };

  return (
    <div className="min-h-screen w-full p-5  bg-[#f8f9fa] flex flex-col justify-between items-center ">
      {/* Main content */}
      <div className="max-w-md w-full max-h-[90vh]  space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-5xl font-extrabold ">23Ventures</h1>
          <p className="mt-2 text-sm text-[#6c757d]">Outreach Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-10 border border-[#e9ecef]">
          <h2 className="text-2xl font-semibold text-center text-[#343a40] mb-6">
            Welcome Back
          </h2>

          {errorMsg && (
            <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 text-sm mb-4">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Field */}
            <div className="flex items-center">
              <div className="h-full px-4 py-3 flex items-center justify-center  border border-[#dee2e6] border-r-0 rounded-l-lg">
                <FaEnvelope className="text-[#adb5bd] h-5 w-5" />
              </div>
              <input
                type="email"
                className="flex-grow py-3 px-4 border border-[#dee2e6] rounded-r-lg outline-none text-sm transition focus:ring-2 focus:ring-[#6a3ea1]/40 focus:border-[#6a3ea1]"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password Field */}
            <div className="flex items-center mt-4">
              <div className="h-full px-4 py-3 flex items-center justify-center  border border-[#dee2e6] border-r-0 rounded-l-lg">
                <FaLock className="text-[#adb5bd] h-5 w-5" />
              </div>
              <input
                type="password"
                className="flex-grow py-3 px-4 border border-[#dee2e6]  rounded-r-lg outline-none text-sm transition focus:ring-2 focus:ring-[#6a3ea1]/40 focus:border-[#6a3ea1]"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold text-white bg-[#6a3ea1] hover:bg-[#8a63c9] rounded-lg transition flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin mr-2 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Logging in...
                </>
              ) : (
                <>
                  <FaSignInAlt className="mr-2" />
                  Log in
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-grow h-px bg-[#dee2e6]" />
            <span className="px-4 text-xs text-[#adb5bd]">or</span>
            <div className="flex-grow h-px bg-[#dee2e6]" />
          </div>

          {/* GitHub Sign-In */}
          <button
            onClick={handleGitHub}
            type="button"
            className="w-full py-3 text-sm font-semibold bg-black text-white hover:bg-[#343a40] rounded-lg transition flex items-center justify-center gap-2"
          >
            <FaGithub className="h-5 w-5" />
            Sign in with GitHub
          </button>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-[#6c757d]">
            Don’t have an account?{" "}
            <a
              href="/signup"
              className="text-[#6a3ea1] font-medium hover:text-[#343a40]"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-md text-center text-xs text-[#adb5bd] mt-6">
        © 2025 23Ventures. All rights reserved.
      </footer>
    </div>
  );
}
