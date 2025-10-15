import api, { resetAuthFlow } from "./api";
import { getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from "./tokenStorage";

export const login = async (username, password) => {
  const response = await api.post("/api/auth/login/", { username, password });
  const { access, refresh } = response.data;

  // 토큰 저장 (localStorage)
  setAccessToken(access);
  setRefreshToken(refresh);

  return response.data;
};

export async function register({ username, password, password2, name, display_name, email }) {
  const payload = { username, password, password2, name, display_name };
  if (email) payload.email = email;
  const { data } = await api.post("/api/auth/register/", payload);
  return data;
};

export async function refreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new Error("No refresh token");
  const { data } = await api.post("/api/auth/refresh/", { refresh });
  const { access, refresh: rotated } = data || {};
  if (access) setAccessToken(access);
  if (rotated) setRefreshToken(rotated);
  return { access, refresh: rotated || refresh };
}

export async function logoutRequest() {
  try {
    const refresh = getRefreshToken();
    if (refresh) {
      await api.post("/api/auth/logout/", { refresh });
    }
  } catch (_) {
    // 서버 로그아웃 실패는 무시(클라이언트 상태 정리가 우선)
  } finally {
    resetAuthFlow();
    clearTokens();
  }
}

export async function fetchMe() {
  // 백엔드에 엔드포인트가 없을 수 있어 다중 후보를 시도하고, 없으면 null 반환
  const candidates = [
    "/api/auth/users/me/",
    "/api/auth/me/",
    "/api/auth/user/",
  ];
  for (const url of candidates) {
    try {
      const { data } = await api.get(url);
      if (data) return data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        // 다음 후보 시도
        continue;
      }
      // 기타 오류는 조용히 무시하고 다음 후보로
      continue;
    }
  }
  return null;
}