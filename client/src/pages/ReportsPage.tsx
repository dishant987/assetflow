import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from "recharts";
import api from "../lib/api";
import { Card, Button, StatusBadge, showToast, PageLoader } from "../components/ui";

const STATUS_COLORS: Record<string, string> = {
  available: "var(--color-success)",
  allocated: "var(--color-info)",
  reserved: "var(--color-warning)",
  under_maintenance: "#F59E0B",
  lost: "var(--color-error)",
  retired: "var(--color-muted)",
  disposed: "var(--color-muted)",
  damaged: "#D97706",
};

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-info)",
  "var(--color-warning)",
  "var(--color-error)",
  "var(--color-muted)",
];

const formatLabel = (key: string) => {
  if (!key) return "";
  const customLabels: Record<string, string> = {
    under_maintenance: "Under Maintenance",
    in_progress: "In Progress",
    transfer_pending: "Transfer Pending",
  };
  return customLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

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
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h2>Reports</h2>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Visualise inventory status, allocation trends, and operations performance.
          </p>
        </div>
        <Button onClick={handleExport} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>📥</span> Export CSV
        </Button>
      </div>

      <div className="reports-grid" style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
        gap: "24px",
        marginBottom: "24px"
      }}>
        <Card title="Assets by Status">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={byStatus}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={3}
                  label={({ name, percent }) => (percent ?? 0) > 0.05 ? `${formatLabel(name as string)} (${((percent ?? 0) * 100).toFixed(0)}%)` : ""}
                  labelLine={true}
                >
                  {byStatus.map((entry: any, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status?.toLowerCase()] || CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                    color: "var(--color-text)"
                  }}
                  formatter={(value, name) => [value, formatLabel(name as string)]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{formatLabel(value)}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Assets by Category">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCategory}>
                <defs>
                  <linearGradient id="colorCategory" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="category_name"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: 'var(--color-bg)', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="url(#colorCategory)" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Utilization Trends (last 12 months)">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={utilization}>
                <defs>
                  <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                  tickFormatter={(val) => {
                    if (!val) return "";
                    const d = new Date(val);
                    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                  }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                  }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                />
                <Area type="monotone" dataKey="allocations" stroke="var(--color-secondary)" strokeWidth={2.5} fill="url(#colorUtilization)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Booking Heatmap (last 30 days)">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={bookingHeatmap}>
                <defs>
                  <linearGradient id="colorBooking" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-info)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-info)" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="day"
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                  tickFormatter={(val) => {
                    if (!val) return "";
                    const d = new Date(val);
                    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: 'var(--color-bg)', opacity: 0.4 }}
                  labelFormatter={(label) => new Date(label).toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                />
                <Bar dataKey="bookings" fill="url(#colorBooking)" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Department Allocation Summary">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptSummary}>
                <defs>
                  <linearGradient id="colorDept" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: 'var(--color-bg)', opacity: 0.4 }}
                />
                <Bar dataKey="allocated_assets" fill="url(#colorDept)" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Maintenance Frequency (Top 20)">
          <div style={{ padding: "16px 8px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={maintenanceFreq}>
                <defs>
                  <linearGradient id="colorMaint" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-warning)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-warning)" stopOpacity={0.15}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" opacity={0.4} vertical={false} />
                <XAxis
                  dataKey="name"
                  angle={-30}
                  textAnchor="end"
                  height={70}
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickLine={{ stroke: 'var(--color-border)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md, 0 4px 6px rgba(0,0,0,0.07))",
                    fontFamily: "var(--font-sans)",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: 'var(--color-bg)', opacity: 0.4 }}
                />
                <Bar dataKey="count" fill="url(#colorMaint)" radius={[4, 4, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: "24px" }}>
        <Card title="Upcoming Maintenance">
          {upcomingMaint.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No upcoming scheduled maintenance.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Issue</th>
                    <th>Priority</th>
                    <th>Scheduled Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMaint.map((r, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{r.name as string}</span>
                          <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-secondary)", marginTop: 2 }}>{r.asset_tag as string}</span>
                        </div>
                      </td>
                      <td style={{ color: "var(--color-text-secondary)" }}>{r.issue_description as string}</td>
                      <td><StatusBadge status={r.priority as string} /></td>
                      <td style={{ color: "var(--color-text-secondary)" }}>
                        {r.scheduled_at ? new Date(r.scheduled_at as string).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "—"}
                      </td>
                      <td><StatusBadge status={r.status as string} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
