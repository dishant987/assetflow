import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";
import { Card, Button, Table, showToast, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";

type Kpi = {
  availableAssets: number;
  allocatedAssets: number;
  underMaintenance: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: number;
};

type ReturnRow = {
  id: string;
  assetTag: string;
  assetName: string;
  employeeName: string;
  allocatedAt: string;
  duration?: string;
};

type ActivityItem = {
  id: string;
  text: string;
  icon: string;
  createdAt: string;
};

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [overdue, setOverdue] = useState<ReturnRow[]>([]);
  const [upcoming, setUpcoming] = useState<ReturnRow[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [k, o, u, act] = await Promise.allSettled([
          api.get("/dashboard/kpi"),
          api.get("/dashboard/overdue-returns"),
          api.get("/dashboard/upcoming-returns"),
          api.get("/dashboard/recent-activity"),
        ]);

        if (k.status === "fulfilled") setKpi(k.value.data.data);

        const mapRow = (r: any): ReturnRow => ({
          id: r.id,
          assetTag: r.asset_tag,
          assetName: r.asset_name,
          employeeName: r.employee_name,
          allocatedAt: r.allocated_at,
          duration: r.duration,
        });

        if (o.status === "fulfilled") setOverdue(o.value.data.data.map(mapRow));
        if (u.status === "fulfilled") setUpcoming(u.value.data.data.map(mapRow));
        if (act.status === "fulfilled") setActivities(act.value.data.data);
      } catch {
        showToast("Failed to load dashboard data", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const cards = kpi ? [
    { label: "Available", value: String(kpi.availableAssets), color: "var(--color-success)", path: "/assets?status=available" },
    { label: "Allocated", value: String(kpi.allocatedAssets), color: "var(--color-info)", path: "/assets?status=allocated" },
    { label: "Under Maintenance", value: String(kpi.underMaintenance), color: "var(--color-warning)", path: "/maintenance" },
    { label: "Active Bookings", value: String(kpi.activeBookings), color: "var(--color-primary)", path: "/bookings" },
    { label: "Pending Transfers", value: String(kpi.pendingTransfers), color: "var(--color-muted)", path: "/assets" },
    { label: "Upcoming Returns", value: String(kpi.upcomingReturns), color: "var(--color-primary)", path: "/allocations" },
  ] : [];

  const cols: Column<ReturnRow>[] = [
    { key: "assetTag", label: "Tag", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{r.assetTag}</span> },
    { key: "assetName", label: "Asset" },
    { key: "employeeName", label: "Holder" },
    { key: "allocatedAt", label: "Since", render: (r) => new Date(r.allocatedAt).toLocaleDateString() },
    { key: "duration", label: "Duration", render: (r) => r.duration ?? "—" },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Welcome, {user?.firstName}</h2>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Today's Overview</h3>
        <div className="kpi-grid">
          {cards.map((s) => (
            <div key={s.label} className="dashboard-card" onClick={() => nav(s.path)}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</span>
              <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {overdue.length > 0 && (
        <div className="alert-banner" onClick={() => nav("/allocations")}>
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <span>⚠️</span>
            <span><strong>{overdue.length} assets overdue for return</strong> - flagged for follow-up</span>
          </div>
          <span>View →</span>
        </div>
      )}

      <div className="flex gap-md" style={{ flexWrap: "wrap", margin: "8px 0" }}>
        <Button onClick={() => nav("/assets?register=true")} style={{ backgroundColor: "var(--color-secondary)", borderColor: "var(--color-secondary)", color: "#fff" }}>
          + Register Asset
        </Button>
        <Button variant="secondary" onClick={() => nav("/bookings?book=true")}>
          Book Resource
        </Button>
        <Button variant="secondary" onClick={() => nav("/maintenance?raise=true")}>
          Raise Requests
        </Button>
      </div>

      <div className="dashboard-layout-cols">
        <Card title="Upcoming Returns">
          {upcoming.length === 0 ? (
            <EmptyState title="No upcoming returns" description="All assets are on track." />
          ) : (
            <Table columns={cols} data={upcoming} />
          )}
        </Card>

        <Card title="Recent Activity">
          {activities.length === 0 ? (
            <EmptyState title="No recent activity" description="Activity will be logged as actions occur." />
          ) : (
            <div className="activity-list">
              {activities.slice(0, 5).map((act) => {
                let bgClass = "bg-default";
                if (act.text.includes("allocated") || act.text.includes("returned")) {
                  bgClass = "bg-allocation";
                } else if (act.text.includes("booked") || act.text.includes("booking")) {
                  bgClass = "bg-booking";
                } else if (act.text.includes("maintenance")) {
                  bgClass = "bg-maintenance";
                }
                return (
                  <div key={act.id} className="activity-card-item">
                    <div className={`activity-icon-container ${bgClass}`}>
                      {act.icon}
                    </div>
                    <div className="activity-info-block">
                      <div className="activity-text-line" title={act.text}>
                        {act.text}
                      </div>
                      <div className="activity-time-line">
                        {formatRelativeTime(act.createdAt)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
