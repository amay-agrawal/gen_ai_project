import axios from 'axios';

// Default to port 4000 where our Express app runs locally
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle global API errors (e.g., 401 Unauthorized -> redirect to login)
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);
