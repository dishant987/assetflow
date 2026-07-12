import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from "recharts";
import api from "../lib/api";
import { Card, Button, StatusBadge, showToast, PageLoader } from "../components/ui";

const COLORS = ["#3b82f6", "#22c55e", "#eab308", "#ef4444", "#a855f7", "#64748b"];

type ChartData = Record<string, unknown>[];

export default function ReportsPage() {
  const [byStatus, setByStatus] = useState<ChartData>([]);
  const [byCategory, setByCategory] = useState<ChartData>([]);
  const [utilization, setUtilization] = useState<ChartData>([]);
  const [maintenanceFreq, setMaintenanceFreq] = useState<ChartData>([]);
  const [upcomingMaint, setUpcomingMaint] = useState<ChartData>([]);
  const [deptSummary, setDeptSummary] = useState<ChartData>([]);
  const [bookingHeatmap, setBookingHeatmap] = useState<ChartData>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [bs, bc, ut, mf, um, ds, bh] = await Promise.all([
          api.get("/reports/by-status"),
          api.get("/reports/by-category"),
          api.get("/reports/utilization"),
          api.get("/reports/maintenance-frequency"),
          api.get("/reports/upcoming-maintenance"),
          api.get("/reports/department-summary"),
          api.get("/reports/booking-heatmap"),
        ]);
        setByStatus(bs.data.data);
        setByCategory(bc.data.data);
        setUtilization(ut.data.data);
        setMaintenanceFreq(mf.data.data);
        setUpcomingMaint(um.data.data);
        setDeptSummary(ds.data.data);
        setBookingHeatmap(bh.data.data);
      } catch { showToast("Failed to load reports", "error"); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleExport = async () => {
    try {
      const r = await api.get("/assets", { params: { limit: 10000 } });
      const assets = r.data.data;
      const rows = assets.map((a: Record<string, unknown>) => [a.assetTag, a.name, a.categoryName, a.status, a.location, a.serialNumber].join(","));
      const csv = "Tag,Name,Category,Status,Location,Serial\n" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "assets-report.csv"; a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("Export failed", "error"); }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports</h2>
        <Button onClick={handleExport}>Export CSV</Button>
      </div>

      <div className="flex flex-col gap-lg">
        <Card title="Assets by Status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Assets by Category">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byCategory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Utilization Trends (last 12 months)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={utilization}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="allocations" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Maintenance Frequency (Top 20)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={maintenanceFreq}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#eab308" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Upcoming Maintenance">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Asset</th><th>Issue</th><th>Priority</th><th>Scheduled</th><th>Status</th></tr></thead>
              <tbody>
                {upcomingMaint.map((r, i) => (
                  <tr key={i}>
                    <td><span style={{ fontFamily: "monospace" }}>{r.asset_tag as string}</span> — {r.name as string}</td>
                    <td>{r.issue_description as string}</td>
                    <td><StatusBadge status={r.priority as string} /></td>
                    <td>{r.scheduled_at ? new Date(r.scheduled_at as string).toLocaleDateString() : "—"}</td>
                    <td><StatusBadge status={r.status as string} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Booking Heatmap (last 30 days)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bookingHeatmap}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="bookings" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Department Allocation Summary">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deptSummary}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="allocated_assets" fill="#a855f7" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
