import { useEffect, useState } from "react";
import api from "../lib/api";
import { Card, Table, Input, Select, showToast, PageLoader, EmptyState, Button } from "../components/ui";
import type { Column } from "../components/ui";

type Employee = { id: string; firstName: string; lastName: string };

type LogEntry = {
  id: string;
  employeeId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function ActivityLogPage() {
  const [rows, setRows] = useState<LogEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ entityType: "", action: "", employeeId: "", from: "", to: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

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
        setPage(1);
      } catch { showToast("Failed to load activity log", "error"); }
      finally { setLoading(false); }
    })();
  }, [filter]);

  const filteredRows = rows.filter((r) => {
    const term = search.toLowerCase();
    if (!term) return true;

    const emp = employees.find((e) => String(e.id) === String(r.employeeId));
    const empName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : "";

    const detailsStr = r.details ? JSON.stringify(r.details).toLowerCase() : "";
    const ipAddressStr = r.ipAddress ? r.ipAddress.toLowerCase() : "";
    const entityIdStr = r.entityId ? r.entityId.toLowerCase() : "";

    return (
      r.action.toLowerCase().includes(term) ||
      r.entityType.toLowerCase().includes(term) ||
      entityIdStr.includes(term) ||
      (r.employeeId && r.employeeId.toLowerCase().includes(term)) ||
      empName.includes(term) ||
      detailsStr.includes(term) ||
      ipAddressStr.includes(term)
    );
  });

  const totalItems = filteredRows.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(page, Math.max(1, totalPages));

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedRows = filteredRows.slice(startIndex, endIndex);

  const cols: Column<LogEntry>[] = [
    { key: "createdAt", label: "Date", sortable: true, render: (r) => new Date(r.createdAt).toLocaleString() },
    { key: "action", label: "Action", sortable: true },
    { key: "entityType", label: "Entity" },
    { key: "entityId", label: "Entity ID" },
    {
      key: "employeeId",
      label: "Actor",
      render: (r) => {
        const emp = employees.find((e) => String(e.id) === String(r.employeeId));
        return emp ? `${emp.firstName} ${emp.lastName}` : (r.employeeId ?? "—");
      }
    },
    { key: "details", label: "Details", render: (r) => r.details ? JSON.stringify(r.details) : "—" },
  ];

  return (
    <div className="page">
      <div className="page-header"><h2>Activity Log</h2></div>
      <div className="flex gap-sm" style={{ marginBottom: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px" }}>
          <Input
            label="Search"
            placeholder="Search action, details, actor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Input label="Entity Type" value={filter.entityType} onChange={(e) => setFilter({ ...filter, entityType: e.target.value })} placeholder="e.g. allocation" />
        <Input label="Action" value={filter.action} onChange={(e) => setFilter({ ...filter, action: e.target.value })} placeholder="e.g. allocated" />
        <Select label="Actor" value={filter.employeeId} onChange={(e) => setFilter({ ...filter, employeeId: e.target.value })} placeholder="All employees" options={employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` }))} />
        <Input label="From" type="date" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
        <Input label="To" type="date" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
      </div>
      <Card>
        {loading ? (
          <PageLoader />
        ) : filteredRows.length === 0 ? (
          <EmptyState
            title="No activity recorded yet"
            description={search || Object.values(filter).some(Boolean) ? "No logs match your search/filter criteria." : "Actions will be logged here as they happen."}
          />
        ) : (
          <Table columns={cols} data={displayedRows} />
        )}
      </Card>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 8px" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </span>
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={activePage === 1}
              onClick={() => setPage(activePage - 1)}
            >
              Previous
            </Button>
            <span style={{ fontSize: 13, fontWeight: 500, padding: "0 8px" }}>
              Page {activePage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={activePage === totalPages}
              onClick={() => setPage(activePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
