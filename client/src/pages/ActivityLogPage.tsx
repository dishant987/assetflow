import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, Table, Input, Select, showToast, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";

type Employee = { id: number; firstName: string; lastName: string };

type LogEntry = {
  id: number;
  employeeId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function ActivityLogPage() {
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entityType: "", action: "", employeeId: "", from: "", to: "" });

  useEffect(() => {
    api.get("/employees").then((r) => setEmployees(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (filter.entityType) params.entityType = filter.entityType;
        if (filter.action) params.action = filter.action;
        if (filter.employeeId) params.employeeId = filter.employeeId;
        if (filter.from) params.from = filter.from;
        if (filter.to) params.to = filter.to;
        const r = await api.get("/activity-logs", { params });
        setRows(r.data.data.rows);
      } catch { showToast("Failed to load activity log", "error"); }
      finally { setLoading(false); }
    })();
  }, [filter]);

  const cols: Column<LogEntry>[] = [
    { key: "createdAt", label: "Date", sortable: true, render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: "action", label: "Action", sortable: true },
    { key: "entityType", label: "Entity" },
    { key: "entityId", label: "Entity ID" },
    { key: "employeeId", label: "Employee ID" },
    { key: "details", label: "Details", render: (r) => r.details ? JSON.stringify(r.details) : "—" },
  ];

  return (
    <div className="page">
      <div className="page-header"><h2>Activity Log</h2></div>
      <div className="flex gap-sm" style={{ marginBottom: 16, flexWrap: "wrap" }}>
        <Input label="Entity Type" value={filter.entityType} onChange={(e) => setFilter({ ...filter, entityType: e.target.value })} placeholder="e.g. allocation" />
        <Input label="Action" value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} placeholder="e.g. allocated" />
        <Select label="Actor" value={filter.employeeId} onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })} placeholder="All employees" options={employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` }))} />
        <Input label="From" type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
        <Input label="To" type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
      </div>
      <Card>
        {loading ? <PageLoader /> : rows.length === 0 ? <EmptyState title="No activity recorded yet" description="Actions will be logged here as they happen." /> : <Table columns={cols} data={rows} />}
      </Card>
    </div>
  );
}
