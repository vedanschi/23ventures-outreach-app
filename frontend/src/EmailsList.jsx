// src/EmailsList.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaRegClock } from "react-icons/fa";
// import './App.css';

export default function EmailsList() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmails = async () => {
      setLoading(true);
      try {
        // First, check if the emails table exists and has data
        const { data: emailsCheck, error: emailsError } = await supabase
          .from("emails")
          .select("*")
          .limit(5);

        if (emailsError) {
          setError(`Error accessing emails table: ${emailsError.message}`);
          setLoading(false);
          return;
        }

        // Try a simpler query first without the join
        const { data, error } = await supabase
          .from("emails")
          .select("*")
          .order("sent_at", { ascending: false });

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
                  .from("startups")
                  .select("name, email")
                  .eq("id", email.startup_id)
                  .single();

                if (startupError || !startup) {
                  return {
                    ...email,
                    startup: { name: "Unknown", email: "unknown@example.com" },
                  };
                }

                return { ...email, startup };
              } else {
                return {
                  ...email,
                  startup: { name: "Unknown", email: "unknown@example.com" },
                };
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
    <div className="container bg-[#f8f9fa] mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-3xl sm:text-4xl font-extrabold  leading-tight">
            Email History
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mt-1 max-w-xs sm:max-w-full">
            Track all emails sent to startups
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md border border-red-300 shadow-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#6a3ea1]"></div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md mx-auto">
          <FaEnvelope className="h-14 w-14 text-neutral-400 mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-neutral-700 mb-3">
            No Emails Sent Yet
          </h2>
          <p className="text-neutral-600 mb-6 px-4">
            Start reaching out to startups to see your email history here.
          </p>
          <button
            onClick={() => navigate("/send")}
            className="px-6 py-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors font-semibold text-sm sm:text-base"
          >
            Send Your First Email
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm sm:text-base">
              <thead className="bg-neutral-50">
                <tr>
                  {["To", "Subject", "Type", "Sent At", "Status"].map(
                    (header) => (
                      <th
                        key={header}
                        className="px-4 sm:px-6 py-3 text-left font-semibold text-neutral-600 uppercase tracking-wide"
                      >
                        {header}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {emails.map((email) => (
                  <tr
                    key={email.id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap max-w-[180px] truncate">
                      <div className="font-medium text-neutral-900">
                        {email.startup.name}
                      </div>
                      <div className="text-neutral-500 text-xs sm:text-sm truncate">
                        {email.startup.email}
                      </div>
                    </td>
                    <td
                      className="px-4 sm:px-6 py-4 whitespace-nowrap max-w-[220px] truncate"
                      title={email.subject}
                    >
                      <div className="text-neutral-900">
                        {email.subject || "No subject"}
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${
                          email.follow_up
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {email.follow_up ? "Follow-Up" : "Initial"}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-neutral-500 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <FaRegClock className="text-neutral-400" />
                        <span>
                          {email.sent_at
                            ? new Date(email.sent_at).toLocaleString()
                            : "Unknown date"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      {email.viewed ? (
                        <div className="flex items-center text-green-600 space-x-1">
                          <FaEye />
                          <span className="text-sm font-medium">Viewed</span>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-sm italic">
                          Not viewed yet
                        </span>
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
