import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, Topbar, Breadcrumb, Button, showToast } from "../ui";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNotificationStore } from "../../stores/useNotificationStore";

const navByRole: Record<string, { label: string; path: string }[]> = {
  admin: [
    { label: "Dashboard", path: "/" },
    { label: "Organization", path: "/organization" },
    { label: "Assets", path: "/assets" },
    { label: "Allocations", path: "/allocations" },
    { label: "Bookings", path: "/bookings" },
    { label: "Maintenance", path: "/maintenance" },
    { label: "Audits", path: "/audits" },
    { label: "Reports", path: "/reports" },
    { label: "Notifications", path: "/notifications" },
  ],
  manager: [
    { label: "Dashboard", path: "/" },
    { label: "Assets", path: "/assets" },
    { label: "Allocations", path: "/allocations" },
    { label: "Bookings", path: "/bookings" },
    { label: "Maintenance", path: "/maintenance" },
    { label: "Reports", path: "/reports" },
    { label: "Notifications", path: "/notifications" },
  ],
  employee: [
    { label: "Dashboard", path: "/" },
    { label: "Assets", path: "/assets" },
    { label: "Bookings", path: "/bookings" },
    { label: "Notifications", path: "/notifications" },
  ],
};

const labelMap: Record<string, string> = {
  "/": "Dashboard",
  "/organization": "Organization",
  "/assets": "Assets",
  "/allocations": "Allocations",
  "/bookings": "Bookings",
  "/maintenance": "Maintenance",
  "/audits": "Audits",
  "/reports": "Reports",
  "/notifications": "Notifications",
};

export function AppLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unread = useNotificationStore((s) => s.unread);

  const role = user?.role ?? "employee";
  const items = (navByRole[role] ?? navByRole.employee).map((n) => ({
    label: n.label,
    href: n.path,
    icon: ({ Dashboard: "📊", Organization: "🏢", Assets: "📦", Allocations: "📋", Bookings: "📅", Maintenance: "🔧", Audits: "📝", Reports: "📈", Notifications: "🔔" } as Record<string, string>)[n.label] ?? "•",
    active: loc.pathname === n.path || (n.path !== "/" && loc.pathname.startsWith(n.path)),
  }));

  const crumbs = loc.pathname.split("/").filter(Boolean).map((seg, i, arr) => ({
    label: labelMap["/" + seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1),
    href: i < arr.length - 1 ? "/" + arr.slice(0, i + 1).join("/") : undefined,
  }));
  if (loc.pathname !== "/") crumbs.unshift({ label: "Dashboard", href: "/" });

  return (
    <div className="app-layout">
      <Sidebar
        items={items}
        onNavigate={(path) => { nav(path); }}
      />
      <div className="app-main">
        <Topbar
          title={crumbs.length > 0 ? crumbs[crumbs.length - 1].label : "Dashboard"}
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => nav("/notifications")}>
                🔔{unread > 0 ? ` (${unread})` : ""}
              </Button>
              <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={() => { logout(); showToast("Signed out", "info"); nav("/login"); }}>
                Sign Out
              </Button>
            </>
          }
        />
        <div style={{ padding: "16px 24px 0" }}>
          <Breadcrumb crumbs={crumbs} />
        </div>
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
