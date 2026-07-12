import { useEffect, useState, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sidebar, Topbar, Breadcrumb, Button, showToast, Modal } from "../ui";
import { useAuthStore } from "../../stores/useAuthStore";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { getSocket } from "../../lib/socketClient";
import api from "../../lib/api";

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
    { label: "Activity Log", path: "/activity-log" },
    { label: "Notifications", path: "/notifications" },
  ],
  manager: [
    { label: "Dashboard", path: "/" },
    { label: "Assets", path: "/assets" },
    { label: "Allocations", path: "/allocations" },
    { label: "Bookings", path: "/bookings" },
    { label: "Maintenance", path: "/maintenance" },
    { label: "Reports", path: "/reports" },
    { label: "Activity Log", path: "/activity-log" },
    { label: "Notifications", path: "/notifications" },
  ],
  department_head: [
    { label: "Dashboard", path: "/" },
    { label: "Assets", path: "/assets" },
    { label: "Allocations", path: "/allocations" },
    { label: "Bookings", path: "/bookings" },
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
  "/activity-log": "Activity Log",
};

export function AppLayout() {
  const loc = useLocation();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unread = useNotificationStore((s) => s.unread);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const { setItems, setUnread, addNotification } = useNotificationStore();

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const { data } = await api.get("/notifications");
        setItems(data.data);
        setUnread(data.data.filter((n: { isRead: boolean }) => !n.isRead).length);
      } catch { /* */ }
    }, 30000);
    return () => clearInterval(poll);
  }, [setItems, setUnread]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (n: { id: string; title: string; message: string; type: string; link?: string; createdAt: string }) => {
      addNotification({ ...n, isRead: false, link: n.link ?? null });
      showToast(n.title, "info");
    };

    const backfill = async () => {
      try {
        const { data } = await api.get("/notifications");
        setItems(data.data);
        setUnread(data.data.filter((n: { isRead: boolean }) => !n.isRead).length);
      } catch { /* */ }
    };

    socket.on("notification:new", handler);
    socket.on("connect", backfill);
    return () => { socket.off("notification:new", handler); socket.off("connect", backfill); };
  }, [addNotification, setItems, setUnread]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

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
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: "var(--radius-md)" }}
                >
                  <span style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
                    )}
                  </span>
                </button>
                {menuOpen && (
                  <div style={{ position: "absolute", right: 0, top: "100%", marginTop: 4, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", minWidth: 160, zIndex: 100, overflow: "hidden" }}>
                    <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", fontSize: 13 }}>
                      <p style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</p>
                      <p style={{ color: "var(--color-text-muted)", fontSize: 12 }}>{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); nav("/profile"); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); setShowLogoutModal(true); }}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 12px", fontSize: 13, background: "none", border: "none", cursor: "pointer", color: "var(--color-error)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-primary-light)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
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

      <Modal
        open={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Sign Out"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setShowLogoutModal(false);
                logout();
                showToast("Signed out successfully", "info");
                nav("/login");
              }}
            >
              Sign Out
            </Button>
          </>
        }
      >
        <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
          Are you sure you want to sign out of AssetFlow? Any unsaved changes may be lost.
        </p>
      </Modal>
    </div>
  );
}
