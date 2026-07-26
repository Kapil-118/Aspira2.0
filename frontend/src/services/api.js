import axios from 'axios';

// Base API configuration
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 60000, // 60s timeout to allow Render free instances to spin up on cold start
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token from localStorage
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aspira_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handlers
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Session expiration handling
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Logging out.');
      localStorage.removeItem('aspira_token');
      localStorage.removeItem('aspira_user');
      // Redirect dynamically if window exists
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
