import { useEffect, useState, useMemo } from "react";
import api from "../lib/api";
import { Card, Table, Button, showToast, StatusBadge } from "../components/ui";
import type { Column } from "../components/ui";

export default function ReportsPage() {
  const [assets, setAssets] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/assets", { params: { limit: 10000 } });
        setAssets(r.data.data);
      } catch { showToast("Failed to load reports", "error"); }
      finally { setLoading(false); }
    })();
  }, []);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assets) { const s = (a.status as string) || "unknown"; m.set(s, (m.get(s) ?? 0) + 1); }
    return Array.from(m, ([status, count]) => ({ status, count }));
  }, [assets]);

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of assets) { const c = (a.categoryName as string) || "Uncategorized"; m.set(c, (m.get(c) ?? 0) + 1); }
    return Array.from(m, ([categoryName, count]) => ({ categoryName, count }));
  }, [assets]);

  const colS: Column<{ status: string; count: number }>[] = [
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "count", label: "Count", sortable: true },
  ];
  const colC: Column<{ categoryName: string; count: number }>[] = [
    { key: "categoryName", label: "Category" },
    { key: "count", label: "Count", sortable: true },
  ];

  const handleExport = () => {
    const rows = assets.map((a) => [a.assetTag, a.name, a.categoryName, a.status, a.location, a.serialNumber].join(","));
    const csv = "Tag,Name,Category,Status,Location,Serial\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "assets-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Reports</h2>
        <Button onClick={handleExport}>Export CSV</Button>
      </div>
      {loading ? <p style={{ color: "var(--color-text-muted)" }}>Loading...</p> : (
        <div className="flex flex-col gap-lg">
          <Card title="Assets by Status"><Table columns={colS} data={byStatus} /></Card>
          <Card title="Assets by Category"><Table columns={colC} data={byCategory} /></Card>
        </div>
      )}
    </div>
  );
}
