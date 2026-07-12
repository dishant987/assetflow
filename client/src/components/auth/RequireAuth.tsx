import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export function RequireAuth() {
  const { user, accessToken } = useAuthStore();
  const loc = useLocation();

  if (!accessToken || !user) {
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return <Outlet />;
}
