import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { login as loginRequest, refreshToken as refreshTokenRequest, logoutRequest, fetchMe } from "../services/authService";
import { getAccessToken as getAccess, getRefreshToken as getRefresh } from "../services/tokenStorage";
import api from "../services/api";

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  login: async (_username, _password) => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => getAccess());
  const [refreshToken, setRefreshToken] = useState(() => getRefresh());
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("access");
    if (!token) return null;
    try {
      const [, payloadBase64] = token.split(".");
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
      const rawRoles = payload?.roles || payload?.role || payload?.groups || [];
      const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);
      return {
        isAuthenticated: true,
        id: payload?.user_id || payload?.sub || null,
        username: payload?.username || payload?.user || null,
        email: payload?.email || null,
        roles,
        permissions: Array.isArray(payload?.permissions) ? payload.permissions : [],
        isStaff: Boolean(payload?.is_staff),
        isSuperuser: Boolean(payload?.is_superuser),
      };
    } catch (_) {
      return { isAuthenticated: true };
    }
  });
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
    // 토큰 변경 시 사용자 정보 동기화
    if (accessToken) {
      try {
        const [, payloadBase64] = accessToken.split(".");
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
        const rawRoles = payload?.roles || payload?.role || payload?.groups || [];
        const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);
        setUser({
          isAuthenticated: true,
          id: payload?.user_id || payload?.sub || null,
          username: payload?.username || payload?.user || null,
          email: payload?.email || null,
          roles,
          permissions: Array.isArray(payload?.permissions) ? payload.permissions : [],
          isStaff: Boolean(payload?.is_staff),
          isSuperuser: Boolean(payload?.is_superuser),
        });
      } catch (_) {
        setUser({ isAuthenticated: true });
      }
    } else {
      setUser(null);
    }
  }, [accessToken]);

  // 응답 인터셉터의 토큰 갱신 이벤트 동기화
  useEffect(() => {
    const onTokenRefreshed = (e) => {
      const detail = e?.detail || {};
      if (detail.access) setAccessToken(detail.access);
      if (detail.refresh) setRefreshToken(detail.refresh);
    };
    window.addEventListener("auth:tokenRefreshed", onTokenRefreshed);
    return () => window.removeEventListener("auth:tokenRefreshed", onTokenRefreshed);
  }, []);

  // 토큰 만료 전 자동 리프레시 스케줄링
  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  const scheduleRefresh = useCallback((jwt) => {
    clearRefreshTimer();
    if (!jwt) return;
    try {
      const [, payloadBase64] = jwt.split(".");
      const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
      const expSec = payload?.exp;
      if (!expSec) return;
      const expMs = expSec * 1000;
      const now = Date.now();
      const earlyMs = 30 * 1000; // 만료 30초 전 리프레시
      const delay = Math.max(0, expMs - now - earlyMs);
      refreshTimerRef.current = setTimeout(async () => {
        try {
          const res = await refreshTokenRequest();
          if (res?.access) {
            setAccessToken(res.access);
          }
          if (res?.refresh) {
            setRefreshToken(res.refresh);
          }
        } catch (_) {
          // 실패 시 로그아웃 유도는 별도 로직에 위임
        }
      }, delay);
    } catch (_) {
      // 토큰 파싱 실패 시 스케줄링 생략
    }
  }, [clearRefreshTimer]);

  // 앱 시작 시 세션 복원 및 스케줄링
  useEffect(() => {
    if (accessToken) {
      scheduleRefresh(accessToken);
      // 프로필 병합 시도 (엔드포인트 없으면 무시)
      fetchMe()
        .then((profile) => {
          if (!profile) return;
          setUser((prev) => ({
            ...(prev || { isAuthenticated: true }),
            ...profile,
          }));
        })
        .catch(() => {});
    }
  }, []);

  // 토큰 변경 시 다시 스케줄링
  useEffect(() => {
    scheduleRefresh(accessToken);
    return () => clearRefreshTimer();
  }, [accessToken, scheduleRefresh, clearRefreshTimer]);

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password);
    const { access, refresh } = data;
    setAccessToken(access || null);
    setRefreshToken(refresh || null);
    if (access) {
      try {
        const [, payloadBase64] = access.split(".");
        const payload = JSON.parse(atob(payloadBase64.replace(/-/g, "+").replace(/_/g, "/")));
        const rawRoles = payload?.roles || payload?.role || payload?.groups || [];
        const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles].filter(Boolean);
        const baseUser = {
          isAuthenticated: true,
          id: payload?.user_id || payload?.sub || null,
          username: payload?.username || payload?.user || null,
          email: payload?.email || null,
          roles,
          permissions: Array.isArray(payload?.permissions) ? payload.permissions : [],
          isStaff: Boolean(payload?.is_staff),
          isSuperuser: Boolean(payload?.is_superuser),
        };
        setUser(baseUser);
        // 프로필 병합 시도
        fetchMe()
          .then((profile) => {
            if (!profile) return;
            setUser((prev) => ({ ...(prev || baseUser), ...profile }));
          })
          .catch(() => {});
      } catch (_) {
        setUser({ isAuthenticated: true });
      }
    } else {
      setUser({ isAuthenticated: true });
    }
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    clearRefreshTimer();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    try {
      window.dispatchEvent(new Event("auth:loggedOut"));
    } catch (_) {}
  }, [clearRefreshTimer]);

  const value = useMemo(
    () => ({
      isAuthenticated: Boolean(accessToken),
      user,
      accessToken,
      refreshToken,
      login,
      logout,
    }),
    [accessToken, refreshToken, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


