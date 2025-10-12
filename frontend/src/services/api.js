// src/services/api.js
import axios from "axios";
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // http://127.0.0.1:8000
});

// 요청 인터셉터: 토큰 자동 부착
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;