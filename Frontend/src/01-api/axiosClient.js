import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 60000 // 60s for Playwright scraping and multi-agent runs
});

// Response interceptor to format errors
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'API request failed';
    console.error('[Axios Client Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default axiosClient;
