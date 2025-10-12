import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { login as loginRequest } from "../services/authService";
import api from "../services/api";

export const AuthContext = createContext({
  isAuthenticated: false,
  user: null,
  accessToken: null,
  login: async (_username, _password) => {},
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem("access"));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem("refresh"));
  const [user, setUser] = useState(() => {
    const hasToken = Boolean(localStorage.getItem("access"));
    return hasToken ? { isAuthenticated: true } : null;
  });

  useEffect(() => {
    if (accessToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    } else {
      delete api.defaults.headers.common["Authorization"];
    }
  }, [accessToken]);

  const login = useCallback(async (username, password) => {
    const data = await loginRequest(username, password);
    const { access, refresh } = data;
    setAccessToken(access || null);
    setRefreshToken(refresh || null);
    setUser({ isAuthenticated: true });
    return data;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
    } catch (_) {}
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

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


