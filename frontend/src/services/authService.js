import api from "./api";

export const login = async (username, password) => {
  const response = await api.post("/api/auth/login/", { username, password });
  const { access, refresh } = response.data;

  // 토큰 저장 (localStorage)
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);

  return response.data;
};

export async function register({ username, password, password2, name, display_name, email }) {
  const payload = { username, password, password2, name, display_name };
  if (email) payload.email = email;
  const { data } = await api.post("/api/auth/register/", payload);
  return data;
};