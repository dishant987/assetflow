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
  id: number;
  assetTag: string;
  assetName: string;
  employeeName: string;
  allocatedAt: string;
  duration?: string;
};

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const nav = useNavigate();
  const [kpi, setKpi] = useState<Kpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [overdue, setOverdue] = useState<ReturnRow[]>([]);
  const [upcoming, setUpcoming] = useState<ReturnRow[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [k, o, u] = await Promise.all([
          api.get("/dashboard/kpi"),
          api.get("/dashboard/overdue-returns"),
          api.get("/dashboard/upcoming-returns"),
        ]);
        setKpi(k.data.data);
        setOverdue(o.data.data);
        setUpcoming(u.data.data);
      } catch { showToast("Failed to load dashboard", "error"); }
      finally { setLoading(false); }
    })();
  }, []);

  const cards = kpi ? [
    { label: "Available Assets", value: String(kpi.availableAssets), color: "var(--color-success)" },
    { label: "Allocated Assets", value: String(kpi.allocatedAssets), color: "var(--color-info)" },
    { label: "Under Maintenance", value: String(kpi.underMaintenance), color: "var(--color-warning)" },
    { label: "Maintenance Today", value: String(kpi.maintenanceToday), color: "var(--color-danger)" },
    { label: "Active Bookings", value: String(kpi.activeBookings), color: "var(--color-primary)" },
    { label: "Pending Transfers", value: String(kpi.pendingTransfers), color: "var(--color-muted)" },
    { label: "Upcoming Returns", value: String(kpi.upcomingReturns), color: "var(--color-purple, #a855f7)" },
  ] : [];

  const cols: Column<ReturnRow>[] = [
    { key: "assetTag", label: "Tag", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.assetTag}</span> },
    { key: "assetName", label: "Asset" },
    { key: "employeeName", label: "Holder" },
    { key: "allocatedAt", label: "Since", render: (r) => new Date(r.allocatedAt).toLocaleDateString() },
    { key: "duration", label: "Duration", render: (r) => r.duration ?? "—" },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="flex flex-col gap-lg">
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Welcome, {user?.firstName}</h2>

      <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
        {cards.map((s) => (
          <Card key={s.label} style={{ flex: "1 1 160px", padding: 20 }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, marginTop: 8, color: s.color }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {overdue.length > 0 && (
        <Card title="Overdue Returns" style={{ borderLeft: "4px solid var(--color-danger)" }}>
          <Table columns={cols} data={overdue} />
        </Card>
      )}

      <Card title="Upcoming Returns">
        {upcoming.length === 0 ? <EmptyState title="No upcoming returns" description="All assets are on track." /> : <Table columns={cols} data={upcoming} />}
      </Card>

      <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
        <Button onClick={() => nav("/assets")}>Manage Assets</Button>
        <Button onClick={() => nav("/allocations")}>Allocations</Button>
        <Button onClick={() => nav("/maintenance")}>Maintenance</Button>
        <Button onClick={() => nav("/bookings")}>Bookings</Button>
      </div>
    </div>
  );
}
