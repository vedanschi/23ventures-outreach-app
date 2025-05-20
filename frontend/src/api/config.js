// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  PROCESS_CSV: '/api/process-csv',
  SEND_EMAIL: '/api/send-email',
  FOLLOWUP_JOB: '/api/followup-job'
};