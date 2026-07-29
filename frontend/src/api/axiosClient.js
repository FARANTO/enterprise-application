import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '';

const axiosClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers || {};
        // Attach Bearer token from localStorage
        config.headers.Authorization = 'Bearer ' + token;
      }
    } catch (err) {
      void err;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (err) {
        void err;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
