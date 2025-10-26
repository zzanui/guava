// src/services/api.js
import axios from "axios";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearTokens } from "./tokenStorage";
const api = axios.create({
  // 개발: vite 프록시 사용 -> ""(상대 경로)
  // 배포: VITE_API_BASE_URL 설정 시 해당 절대 경로 사용
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
  withCredentials: false, // 추후 쿠키 전략으로 전환 시 true로 변경
});

// 요청 인터셉터: 토큰 자동 부착
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터: 401 시 토큰 자동 재발급 및 요청 재시도
let isRefreshing = false;
let refreshQueue = [];

function processRefreshQueue(error, newAccessToken) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(newAccessToken);
    }
  });
  refreshQueue = [];
}

// 전역 로그아웃 시 인터셉터 내부 상태 초기화를 위한 헬퍼
export function resetAuthFlow() {
  isRefreshing = false;
  try {
    processRefreshQueue(new Error("logout"), null);
  } catch (_) {}
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const DISABLE_REFRESH = import.meta?.env?.VITE_DISABLE_REFRESH === "true";

    // 조건: 401이며, 아직 재시도한 적 없는 요청, 그리고 로그인/리프레시 요청 자체가 아닌 경우만 처리
    const isAuthPath = typeof originalRequest.url === "string" && (
      originalRequest.url.includes("/api/auth/login/") ||
      originalRequest.url.includes("/api/auth/refresh/")
    );

    if (!DISABLE_REFRESH && status === 401 && !originalRequest._retry && !isAuthPath) {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        // 리프레시 토큰이 없으면 바로 실패 처리
        clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 리프레시 진행 중이면 큐에 대기시키고, 완료되면 토큰으로 재시도
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((newToken) => {
            originalRequest._retry = true;
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshEndpoint = 
          (api.defaults?.baseURL ? `${api.defaults.baseURL}` : "") + 
          "/api/auth/refresh/";

        // 리프레시 요청은 전역 인터셉터 영향을 최소화하기 위해 axios 기본 인스턴스로 수행
        const resp = await axios.post(
          refreshEndpoint,
          { refresh: refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );

        const newAccess = resp?.data?.access;
        const newRefresh = resp?.data?.refresh; // 회전(rotate) 설정 시 제공될 수 있음

        if (!newAccess) {
          throw error;
        }

        // 저장 및 헤더 갱신
        setAccessToken(newAccess);
        if (newRefresh) setRefreshToken(newRefresh);
        api.defaults.headers.common["Authorization"] = `Bearer ${newAccess}`;

        // 프론트 전역 동기화를 위한 이벤트 디스패치
        try {
          window.dispatchEvent(
            new CustomEvent("auth:tokenRefreshed", {
              detail: { access: newAccess, refresh: newRefresh || null },
            })
          );
        } catch (_) {}

        processRefreshQueue(null, newAccess);

        // 원래 요청 재시도
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers["Authorization"] = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processRefreshQueue(refreshErr, null);
        clearTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// --- Prefs sync client (stub endpoints) ---
export async function syncPrefsToServer(payload) {
  try {
    const { data } = await api.post('/api/my/prefs/sync/', payload);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function fetchPrefsFromServer() {
  try {
    const { data } = await api.get('/api/my/prefs/');
    return data;
  } catch (e) {
    throw e;
  }
}