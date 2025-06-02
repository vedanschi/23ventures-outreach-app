// src/StartupsList.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaPlus,
  FaExternalLinkAlt,
  FaLinkedin,
  FaSpinner,
} from "react-icons/fa";
// import './App.css';

export default function StartupsList() {
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStartup, setNewStartup] = useState({
    name: "",
    email: "",
    website: "",
    linkedin: "",
    industry: "",
    tech_stack: "",
  });
  const [addingStartup, setAddingStartup] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStartups();
  }, []);

  const fetchStartups = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("startups")
      .select(
        "id, name, email, website, linkedin, industry, tech_stack, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setMessageType("error");
    } else {
      setStartups(data);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStartup((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!newStartup.name.trim()) return "Name is required";
    if (!newStartup.email.trim()) return "Email is required";
    if (!newStartup.email.includes("@")) return "Email is invalid";

    // Basic URL validation
    if (newStartup.website && !newStartup.website.startsWith("http")) {
      return "Website must start with http:// or https://";
    }
    if (newStartup.linkedin && !newStartup.linkedin.startsWith("http")) {
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
      setMessageType("error");
      return;
    }

    setAddingStartup(true);
    setMessage("");

    try {
      // Ensure URLs have proper format
      const formattedStartup = {
        ...newStartup,
        website: newStartup.website || "https://example.com",
        linkedin: newStartup.linkedin || "https://linkedin.com/company/example",
      };

      const { data, error } = await supabase
        .from("startups")
        .insert([formattedStartup])
        .select();

      if (error) throw error;

      // Success - update the UI
      setStartups((prev) => [data[0], ...prev]);
      setMessage("Startup added successfully!");
      setMessageType("success");
      setNewStartup({
        name: "",
        email: "",
        website: "",
        linkedin: "",
        industry: "",
        tech_stack: "",
      });
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding startup:", err);
      setMessage(`Error: ${err.message}`);
      setMessageType("error");
    } finally {
      setAddingStartup(false);
    }
  };

  return (
    <div className="min-h-screen w-full p-4 sm:p-6 md:p-8 bg-[#f8f9fa] flex flex-col justify-start items-center">
      <div className="w-full max-w-7xl flex flex-col  sm:justify-between sm:items-center mb-6 gap-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-2 sm:mb-4 text-center sm:text-left">
            Startups
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base text-center sm:text-left">
            Manage your startup database
          </p>
        </div>
        <div className="flex justify-center sm:justify-end gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-2 rounded-md flex items-center transition-colors ${
              showAddForm
                ? "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                : "bg-[#6a3ea1] text-white hover:bg-[#8a63c9]"
            }`}
          >
            {showAddForm ? (
              "Cancel"
            ) : (
              <>
                <FaPlus className="mr-2" />
                Add Startup
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`w-full max-w-3xl mb-6 p-4 rounded-md text-sm ${
            messageType === "success"
              ? "bg-green-100 text-green-700 border border-green-300"
              : "bg-red-100 text-red-700 border border-red-300"
          }`}
        >
          {message}
        </div>
      )}

      {showAddForm && (
        <div className="w-full max-w-3xl mb-6 p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-neutral-800">
            Add New Startup
          </h2>
          <form onSubmit={handleAddStartup}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: "Name", type: "text", name: "name", required: true },
                {
                  label: "Email",
                  type: "email",
                  name: "email",
                  required: true,
                },
                {
                  label: "Website",
                  type: "url",
                  name: "website",
                  placeholder: "https://example.com",
                },
                {
                  label: "LinkedIn",
                  type: "url",
                  name: "linkedin",
                  placeholder: "https://linkedin.com/company/example",
                },
                { label: "Industry", type: "text", name: "industry" },
                { label: "Tech Stack", type: "text", name: "tech_stack" },
              ].map(({ label, ...rest }) => (
                <div key={rest.name}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {label}{" "}
                    {rest.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    {...rest}
                    value={newStartup[rest.name]}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded focus:ring focus:ring-[#8a63c9] focus:border-[#6a3ea1] text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={addingStartup}
                className="px-4 py-2 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] disabled:opacity-50 flex items-center transition-colors"
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
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#6a3ea1]"></div>
        </div>
      ) : error ? (
        <div className="w-full max-w-3xl p-6 bg-red-100 text-red-700 rounded-md border border-red-300">
          Error: {error}
        </div>
      ) : startups.length === 0 ? (
        <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8 text-center">
          <FaUsers className="h-12 w-12 text-[#6a3ea1] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">
            No Startups Yet
          </h2>
          <p className="text-neutral-600 mb-4">
            Add your first startup to get started.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#6a3ea1] text-white rounded-md hover:bg-[#8a63c9] transition-colors"
          >
            <FaPlus className="inline mr-2" />
            Add Your First Startup
          </button>
        </div>
      ) : (
        <div className="w-full overflow-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-neutral-500 uppercase text-xs tracking-wider">
              <tr>
                {[
                  "Name",
                  "Email",
                  "Website",
                  "LinkedIn",
                  "Industry",
                  "Tech Stack",
                  "Joined",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {startups.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">{s.name}</td>
                  <td className="px-4 py-4 text-neutral-500">{s.email}</td>
                  <td className="px-4 py-4">
                    {s.website && (
                      <a
                        href={s.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        {new URL(s.website).hostname}
                        <FaExternalLinkAlt className="ml-1 h-3 w-3" />
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {s.linkedin && (
                      <a
                        href={s.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <FaLinkedin className="mr-1" />
                        LinkedIn
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-4 text-neutral-500">
                    {s.industry || "-"}
                  </td>
                  <td className="px-4 py-4 text-neutral-500">
                    {s.tech_stack || "-"}
                  </td>
                  <td className="px-4 py-4 text-neutral-500">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
