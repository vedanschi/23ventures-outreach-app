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
    <div className="min-h-screen w-full p-5 bg-[#f8f9fa] flex flex-col justify-start items-center">
      <h1 className="text-5xl sm:text-4xl font-extrabold leading-tight mb-4 text-center">
        Upload Startups CSV
      </h1>

      <div className="mb-4 w-full max-w-md">
        <label className="block border border-gray-300 rounded-md overflow-hidden bg-white">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
        file:mr-4 file:py-3 file:px-4
        file:rounded-none file:border-0
        file:text-sm file:font-semibold
        file:bg-blue-50 file:text-blue-700
        hover:file:bg-blue-100"
          />
        </label>
      </div>

      {message && <p className="mb-4">{message}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-neutral-400 disabled:cursor-not-allowed disabled:opacity-90"
      >
        {uploading ? "Uploading..." : "Upload and Process"}
      </button>

      <div className="mt-4">
        <button
          onClick={() => navigate("/dashboard")}
          className=" px-6 py-3  text-white bg-[#6a3ea1] hover:bg-[#8a63c9]  rounded transition flex items-center justify-center "
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
