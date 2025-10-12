import api from "@/api";

export async function login({ username, password }) {
  const { data } = await api.post("/api/auth/jwt/create/", { username, password });
  // 토큰 저장 (개발용)
  localStorage.setItem("access", data.access);
  api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
  return data;
}