// src/UploadCsv.jsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
import {
  FaUpload,
  FaFileUpload,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowLeft,
} from "react-icons/fa";
import { API_BASE_URL, API_ENDPOINTS } from "./api/config";
// import "./App.css";

export default function UploadCsv() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setMessage("");
      setMessageType("");
    } else {
      setFile(null);
      setMessage("Please select a valid CSV file.");
      setMessageType("error");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a file first.");
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      // 1) Upload to Supabase Storage
      const filename = `${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("csv")
        .upload(filename, file);

      if (error) throw error;

      // 2) Trigger backend processing
      // Updated to use the API config
      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.PROCESS_CSV}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ path: filename }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Processing failed");
      }

      setMessage(`Success! ${result.inserted || 0} startups imported.`);
    } catch (err) {
      console.error("Error:", err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container bg-[#f8f9fa] mx-auto px-4 py-6">
      <h1 className="text-3xl sm:text-4xl font-extrabold  leading-tight mb-4">
        Upload Startups CSV
      </h1>

      <div className="mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
      </div>

      {message && <p className="mb-4">{message}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload and Process"}
      </button>

      <div className="mt-4">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-gray-600 "
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
