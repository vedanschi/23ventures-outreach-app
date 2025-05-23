// src/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "./supabaseClient";
import {
  FaUsers,
  FaEnvelope,
  FaEye,
  FaUpload,
  FaUserPlus,
  FaPaperPlane,
} from "react-icons/fa";
// import './App.css';

export default function Dashboard({ session }) {
  const [stats, setStats] = useState({
    startups: 0,
    emails: 0,
    viewed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentEmails, setRecentEmails] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      try {
        // Fetch startup count
        const { count: startupsCount, error: startupsError } = await supabase
          .from("startups")
          .select("*", { count: "exact", head: true });

        if (startupsError) throw startupsError;

        // Fetch email count
        const { count: emailsCount, error: emailsError } = await supabase
          .from("emails")
          .select("*", { count: "exact", head: true });

        if (emailsError) throw emailsError;

        // Fetch viewed email count
        const { count: viewedCount, error: viewedError } = await supabase
          .from("emails")
          .select("*", { count: "exact", head: true })
          .eq("viewed", true);

        if (viewedError) throw viewedError;

        // Fetch recent emails
        const { data: recentEmailsData, error: recentEmailsError } =
          await supabase
            .from("emails")
            .select(
              `
            id,
            subject,
            sent_at,
            viewed,
            startup: startups(name)
          `
            )
            .order("sent_at", { ascending: false })
            .limit(5);

        if (recentEmailsError) throw recentEmailsError;

        setStats({
          startups: startupsCount || 0,
          emails: emailsCount || 0,
          viewed: viewedCount || 0,
        });

        setRecentEmails(recentEmailsData || []);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="container bg-[#f8f9fa] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold sm:text-4xl  mb-2">
          Welcome to 23Ventures Outreach
        </h1>
        <p className="text-neutral-600 text-sm sm:text-base">
          Manage your startup outreach campaigns from one place
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#6a3ea1]"></div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {/* Card 1 */}
            <div className="bg-white rounded-xl shadow p-6 border-t-4 border-[#6a3ea1] transition hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700">
                    Startups
                  </h2>
                  <p className="text-3xl font-bold text-[#6a3ea1]">
                    {stats.startups}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Total startups in database
                  </p>
                </div>
                <div className=" bg-opacity-10 p-3 rounded-full">
                  <FaUsers className="text-[#6a3ea1] h-5 w-5" />
                </div>
              </div>
              <Link
                to="/startups"
                className="mt-4 inline-block text-[#6a3ea1] hover:underline text-sm font-medium"
              >
                View all startups →
              </Link>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl shadow p-6 border-t-4 border-[#6a3ea1] transition hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700">
                    Emails Sent
                  </h2>
                  <p className="text-3xl font-bold text-[#6a3ea1]">
                    {stats.emails}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Total emails sent to startups
                  </p>
                </div>
                <div className=" bg-opacity-10 p-3 rounded-full">
                  <FaEnvelope className="text-[#6a3ea1] h-5 w-5" />
                </div>
              </div>
              <Link
                to="/send"
                className="mt-4 inline-block text-[#6a3ea1] hover:underline text-sm font-medium"
              >
                Send more emails →
              </Link>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl shadow p-6 border-t-4 border-[#6a3ea1] transition hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-neutral-700">
                    Emails Viewed
                  </h2>
                  <p className="text-3xl font-bold text-[#6a3ea1]">
                    {stats.viewed}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Emails opened by recipients
                  </p>
                </div>
                <div className="bg-accent-green bg-opacity-10 p-3 rounded-full">
                  <FaEye className="text-[#6a3ea1] h-5 w-5" />
                </div>
              </div>
              <Link
                to="/emails"
                className="mt-4 inline-block text-[#6a3ea1] hover:underline text-sm font-medium"
              >
                View email history →
              </Link>
            </div>
          </div>

          {/* Quick Actions and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                Quick Actions
              </h2>
              <div className="flex flex-col gap-3">
                <Link
                  to="/upload"
                  className="flex items-center p-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors duration-200"
                >
                  <FaUpload className="mr-2" />
                  Upload Startup CSV
                </Link>
                <Link
                  to="/startups"
                  className="flex items-center p-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors duration-200"
                >
                  <FaUserPlus className="mr-2" />
                  Add New Startup
                </Link>
                <Link
                  to="/send"
                  className="flex items-center p-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors duration-200"
                >
                  <FaPaperPlane className="mr-2" />
                  Send Outreach Emails
                </Link>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold text-neutral-800 mb-4">
                Recent Activity
              </h2>
              {recentEmails.length > 0 ? (
                <div className="space-y-4">
                  {recentEmails.map((email) => (
                    <div
                      key={email.id}
                      className="border-b border-neutral-200 pb-3 last:border-none"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-neutral-800">
                            {email.subject}
                          </p>
                          <p className="text-sm text-neutral-600">
                            To: {email.startup?.name || "Unknown"}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            email.viewed
                              ? "bg-green-100 text-green-800"
                              : "bg-neutral-100 text-neutral-800"
                          }`}
                        >
                          {email.viewed ? "Viewed" : "Sent"}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        {new Date(email.sent_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-600 text-sm">
                  No recent activity to display. Start by adding startups or
                  sending emails.
                </p>
              )}

              <div className="mt-4 text-right">
                <Link
                  to="/emails"
                  className="text-[#6a3ea1] hover:underline text-sm font-medium"
                >
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
