import { Outlet } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { AccessDenied } from "../../pages/AccessDenied";

interface Props {
  roles: string[];
}

export function RequireRole({ roles }: Props) {
  const user = useAuthStore((s) => s.user);
  if (!user || !roles.includes(user.role)) {
    return <AccessDenied />;
  }
  return <Outlet />;
}
