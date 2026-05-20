// Centralized configuration for the API Base URL.
// In production, configure VITE_API_URL in your Vercel dashboard.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
