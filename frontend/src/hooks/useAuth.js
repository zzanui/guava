// src/hooks/useAuth.js
import { useState } from "react";
import { login } from "../services/authService";

export default function useAuth() {
  const [user, setUser] = useState(null);

  const handleLogin = async (email, password) => {
    const tokens = await login(email, password);
    if (tokens.access) {
      setUser({ email });
    }
  };

  return { user, handleLogin };
}