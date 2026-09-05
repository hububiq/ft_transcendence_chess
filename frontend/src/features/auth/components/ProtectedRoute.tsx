import { type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/AuthProvider";

interface ProtectedRouteProp {
  children?: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProp) {
  const { user, isInitializing } = useAuth();
  const location = useLocation();

  // wating for initial auth check to complete
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Checking authentication...</div>
      </div>
    );
  }

  // redirect to login
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
