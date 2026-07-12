import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export function RequireAuth() {
  const { user, accessToken, fetchSession } = useAuthStore();
  const loc = useLocation();

  useEffect(() => {
    if (accessToken && !user) fetchSession();
  }, [accessToken, user, fetchSession]);

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return <Outlet />;
}
