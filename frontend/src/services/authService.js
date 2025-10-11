// src/services/authService.js
import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/auth/jwt/create/", {
    email,
    password,
  });
  const { access, refresh } = response.data;

  // 토큰 저장 (localStorage)
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);

  return response.data;
};

export const signup = async (email, password, name) => {
  return api.post("/auth/users/", { email, password, name });
};

export const getUserInfo = async () => {
  const token = localStorage.getItem("access_token");
  return api.get("/auth/users/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });
};