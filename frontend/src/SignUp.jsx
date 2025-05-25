// src/SignUp.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FaGithub, FaEnvelope, FaLock, FaUserPlus } from "react-icons/fa";
// import './App.css';

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        return;
      }

      setSuccessMsg(
        "Registration successful! Please check your email to confirm your account."
      );
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  };

  return (
    <div className="min-h-screen w-full p-5 bg-[#f8f9fa] flex flex-col justify-between items-center ">
      {/* Main content */}
      <div className="max-w-md w-full max-h-[90vh]  space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-5xl font-extrabold ">23Ventures</h1>
          <p className="mt-2 text-sm text-[#6c757d]">Outreach Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef]">
          <h2 className="text-2xl font-semibold text-center text-[#343a40] mb-6">
            Create an Account
          </h2>

          {/* Alerts */}
          {errorMsg && (
            <div className="bg-red-100 text-red-700 border border-red-300 rounded-md p-3 text-sm mb-4">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-green-100 text-green-700 border border-green-300 rounded-md p-3 text-sm mb-4">
              {successMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Email */}
            {/* <div className="flex items-center border border-[#dee2e6] rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-[#3cb371]/30 focus-within:border-[#3cb371] transition">
              <FaEnvelope className="text-[#adb5bd] h-5 w-5 mr-3 flex-shrink-0" />
              <input
                type="email"
                className="w-full bg-transparent outline-none text-sm placeholder:text-[#adb5bd] border-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div> */}
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

            {/* Password */}
            {/* <div className="flex items-center border border-[#dee2e6] rounded-lg px-4 py-2 focus-within:ring-2 focus-within:ring-[#3cb371]/30 focus-within:border-[#3cb371] transition">
              <FaLock className="text-[#adb5bd] h-5 w-5 mr-3 flex-shrink-0" />
              <input
                type="password"
                className="w-full bg-transparent outline-none text-sm placeholder:text-[#adb5bd] border-none"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                required
              />
            </div> */}
            <div className="flex items-center mt-4">
              <div className="h-full px-4 py-3 flex items-center justify-center  border border-[#dee2e6] border-r-0 rounded-l-lg">
                <FaLock className="text-[#adb5bd] h-5 w-5" />
              </div>
              <input
                type="password"
                className="flex-grow py-3 px-4 border border-[#dee2e6]  rounded-r-lg outline-none text-sm transition focus:ring-2 focus:ring-[#6a3ea1]/40 focus:border-[#6a3ea1]"
                placeholder="Password (min. 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="6"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-sm font-semibold text-white bg-[#6a3ea1] hover:bg-[#8a63c9]  rounded-lg transition flex items-center justify-center"
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
                  Creating account...
                </>
              ) : (
                <>
                  <FaUserPlus className="mr-2" />
                  Sign Up
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

          {/* GitHub Sign-Up */}
          <button
            onClick={handleGitHub}
            type="button"
            className="w-full py-3 text-sm font-semibold bg-black text-white rounded-lg hover:bg-[#343a40] transition flex items-center justify-center gap-2"
          >
            <FaGithub className="h-5 w-5" />
            Sign up with GitHub
          </button>

          {/* Login Link */}
          <p className="mt-6 text-center text-sm text-[#6c757d]">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-[#6a3ea1] hover:text-[#343a40] font-medium"
            >
              Log In
            </a>
          </p>
        </div>
      </div>
      {/* Footer */}
      <p className="text-center text-xs text-[#adb5bd] mt-10">
        © 2025 23Ventures. All rights reserved.
      </p>
    </div>
  );
}
