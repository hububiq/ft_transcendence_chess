import React, { type ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthProvider"; // Adjust import path if needed

interface PublicOnlyRouteProps {
  children?: ReactNode;
  redirectTo?: string;
}

export function PublicOnlyRoute({
  children,
  redirectTo = "/",
}: PublicOnlyRouteProps) {
  const { user, isInitializing } = useAuth();

  // Wait for auth check to finish
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  // 2. If already logged in, redirect them away from guest-only pages
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // 3. Otherwise, let them see the login/register page
  return children ? <>{children}</> : <Outlet />;
}