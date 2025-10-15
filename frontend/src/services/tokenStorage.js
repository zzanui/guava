// src/services/tokenStorage.js
// 간단한 토큰 저장 추상화: 현재는 localStorage 기반.
// 추후 httpOnly 쿠키로 전환 시 이 모듈만 교체하면 됩니다.

const ACCESS_KEY = "access";
const REFRESH_KEY = "refresh";

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch (_) {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch (_) {
    return null;
  }
}

export function setAccessToken(token) {
  try {
    if (token) localStorage.setItem(ACCESS_KEY, token);
    else localStorage.removeItem(ACCESS_KEY);
  } catch (_) {}
}

export function setRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch (_) {}
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch (_) {}
}


