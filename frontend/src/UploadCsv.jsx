// src/UploadCsv.jsx
import React, { useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

export default function UploadCsv() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    // 1) Build a unique path for the file:
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `csv/${fileName}`;

    // 2) —– THIS IS WHERE the upload() CALL GOES —–
    const { error: uploadError } = await supabase
      .storage
      .from('csv')
      .upload(
        filePath,          // the key under which to store the file
        file,              // the File object from <input type="file" />
        { cacheControl: '3600', upsert: false }
      );

    if (uploadError) {
      setErrorMsg(uploadError.message);
      setUploading(false);
      return;
    }

    // 2) Trigger CSV processing via serverless function
    try {
      const response = await fetch('/api/process-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath }),
      });
      if (!response.ok) throw new Error('Failed to process CSV');
      setSuccessMsg('CSV uploaded and processing started successfully.');
    } catch (err) {
      setErrorMsg(err.message);
    }

    setUploading(false);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Upload CSV</h1>
      {errorMsg && <div className="text-red-500 mb-2">{errorMsg}</div>}
      {successMsg && <div className="text-green-500 mb-2">{successMsg}</div>}

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="mb-4 w-full"
      />

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
      >
        {uploading ? 'Uploading...' : 'Upload CSV'}
      </button>
    </div>
  );
}
