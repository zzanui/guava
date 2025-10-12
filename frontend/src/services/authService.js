import api from "./api";

export async function login(username, password) {
  const { data } = await api.post("/api/auth/login/", { username, password });
  // 토큰 저장 (개발용)
  localStorage.setItem("access", data.access);
  api.defaults.headers.common.Authorization = `Bearer ${data.access}`;
  return data;
}

export async function register({ username, password, password2, name, display_name, email }) {
  const payload = { username, password, password2, name, display_name };
  if (email) payload.email = email;
  const { data } = await api.post("/api/auth/register/", payload);
  return data;
}