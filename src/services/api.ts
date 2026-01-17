import axios from 'axios';

// Get API URL from environment variable, fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000;

// Base API instance configured for the backend
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Request interceptor for adding auth tokens or logging
api.interceptors.request.use(
  (config) => {
    // You can add authorization headers here if needed
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common errors globally
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // Extract error message from response
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.message || 
                          'An error occurred';
      
      // Create a custom error with the server's message
      const customError = new Error(errorMessage);
      (customError as any).status = error.response.status;
      (customError as any).originalError = error;
      
      return Promise.reject(customError);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Error in request configuration
      console.error('Request Error:', error.message);
      return Promise.reject(error);
    }
  }
);

export default api;
