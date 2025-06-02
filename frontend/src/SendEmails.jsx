// src/SendEmails.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FaPaperPlane,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "./api/config";
// import './App.css';

export default function SendEmails() {
  const [startups, setStartups] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [emailType, setEmailType] = useState("outreach"); // 'outreach' or 'followup'
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch startup info for emailing
    setLoading(true);
    supabase
      .from("startups")
      .select("id, name, email, industry")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          setMessage(`Error loading startups: ${error.message}`);
          setMessageType("error");
        } else {
          setStartups(data || []);
        }
        setLoading(false);
      });
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === startups.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(startups.map((s) => s.id)));
    }
  };

  const sendEmails = async () => {
    setSending(true);
    setMessage("");
    setMessageType("");

    try {
      // Build list of selected startup details
      const payloadList = startups
        .filter((s) => selectedIds.has(s.id))
        .map((s) => ({
          type: emailType,
          company_name: s.name,
          recipient_name: s.name,
          recipient_email: s.email,
          product_description: s.industry, // for outreach
          previous_interaction: "Initial email sent you.", // for followup
          startup_id: s.id,
        }));

      // Send each email sequentially (or batch as desired)
      for (const payload of payloadList) {
        const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.SEND_EMAIL}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || "Send failed");
      }

      setMessage(`Successfully sent ${payloadList.length} emails.`);
      setMessageType("success");
      setSelectedIds(new Set());
    } catch (err) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
      setMessageType("error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-5 bg-[#f8f9fa] flex flex-col justify-start items-center ">
      <div className="flex flex-col sm:flex-row justify-center sm:justify-between items-center mb-8 text-center sm:text-left">
        <div>
          <h1 className="text-4xl sm:text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-center">
            Send Emails
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base mt-1 max-w-xs sm:max-w-full">
            Reach out to startups in your database
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md shadow-sm flex items-center space-x-2 ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
          role="alert"
        >
          {messageType === "success" ? (
            <FaCheck className="flex-shrink-0 text-green-700" />
          ) : (
            <FaExclamationTriangle className="flex-shrink-0 text-red-700" />
          )}
          <span className="text-sm sm:text-base">{message}</span>
        </div>
      )}

      <div className="mb-4 flex items-center justify-start space-x-6 text-sm  text-neutral-700 font-medium">
        <span>Email Type:</span>
        <label className="relative cursor-pointer">
          <input
            type="radio"
            name="emailType"
            value="outreach"
            checked={emailType === "outreach"}
            onChange={() => setEmailType("outreach")}
            className="peer sr-only "
          />
          <span className="inline-block  px-3 py-1 rounded-full border-2 border-neutral-300 peer-checked:bg-white peer-checked:text-[#6a3ea1] peer-checked:border-[#6a3ea1] transition-colors">
            Initial Outreach
          </span>
        </label>

        <label className="relative cursor-pointer">
          <input
            type="radio"
            name="emailType"
            value="followup"
            checked={emailType === "followup"}
            onChange={() => setEmailType("followup")}
            className="peer sr-only"
          />
          <span className="inline-block px-3 py-1 rounded-full border-2 border-neutral-300 peer-checked:bg-white peer-checked:text-[#6a3ea1] peer-checked:border-[#6a3ea1] transition-colors">
            Follow-Up
          </span>
        </label>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-[#6a3ea1]"></div>
        </div>
      ) : startups.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-10 text-center max-w-md mx-auto">
          <FaPaperPlane className="h-14 w-14 text-[#6a3ea1] mx-auto mb-5" />
          <h2 className="text-2xl font-semibold text-neutral-700 mb-3">
            No Startups Available
          </h2>
          <p className="text-neutral-600 mb-6 px-4">
            Add startups to your database before sending emails.
          </p>
          <button
            onClick={() => navigate("/upload")}
            className="px-6 py-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors font-semibold text-sm sm:text-base"
          >
            Upload Startups CSV
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="p-4 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="form-checkbox h-5 w-5 text-[#6a3ea1] rounded focus:ring-[#6a3ea1]"
                  checked={
                    selectedIds.size === startups.length && startups.length > 0
                  }
                  onChange={toggleSelectAll}
                />
                <span className="text-neutral-700 font-medium text-sm sm:text-base">
                  {selectedIds.size} of {startups.length} selected
                </span>
              </div>
              <button
                onClick={sendEmails}
                disabled={sending || selectedIds.size === 0}
                className={`px-5 py-2 rounded-md flex items-center justify-center text-sm sm:text-base font-semibold transition-colors ${
                  sending || selectedIds.size === 0
                    ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                    : "bg-[#6a3ea1] text-white hover:bg-[#8a63c9]"
                }`}
              >
                {sending ? "Sending..." : `Send ${selectedIds.size} Email(s)`}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 overflow-x-auto">
            <table className="min-w-full table-auto border-collapse text-sm sm:text-base">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-3 sm:px-6 py-2 text-left w-12"></th>
                  <th className="px-3 sm:px-6 py-2 text-left font-semibold text-neutral-700">
                    Name
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-left font-semibold text-neutral-700">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-2 text-left font-semibold text-neutral-700">
                    Industry
                  </th>
                </tr>
              </thead>
              <tbody>
                {startups.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
                  >
                    <td className="px-3 sm:px-6 py-3">
                      <input
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-[#6a3ea1] rounded focus:ring-[#6a3ea1]"
                        checked={selectedIds.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                    </td>
                    <td
                      className="px-3 sm:px-6 py-3 max-w-[150px] truncate"
                      title={s.name}
                    >
                      {s.name}
                    </td>
                    <td
                      className="px-3 sm:px-6 py-3 max-w-[180px] truncate"
                      title={s.email}
                    >
                      {s.email}
                    </td>
                    <td
                      className="px-3 sm:px-6 py-3 max-w-[130px] truncate"
                      title={s.industry}
                    >
                      {s.industry}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <div className="mt-6 text-center sm:text-left">
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors font-semibold text-sm sm:text-base "
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
