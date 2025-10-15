import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RequireAuth({ children, roles, requireStaff = false, requireSuperuser = false, allRoles = false }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 역할/권한 검사
  if (user) {
    if (requireSuperuser && !user.isSuperuser) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    if (requireStaff && !user.isStaff) {
      return <Navigate to="/" replace state={{ from: location }} />;
    }
    if (Array.isArray(roles) && roles.length > 0) {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];
      const hasRoles = allRoles
        ? roles.every((r) => userRoles.includes(r))
        : roles.some((r) => userRoles.includes(r));
      if (!hasRoles) {
        return <Navigate to="/" replace state={{ from: location }} />;
      }
    }
  }

  return children;
}


