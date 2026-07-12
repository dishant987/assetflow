import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button, Input, Select, Table, Card, StatusBadge, showToast, Modal, PageLoader } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { isAssetManager, isDepartmentHead } from "../lib/roles";
import { useAuthStore } from "../stores/useAuthStore";

type AuditItem = {
  id: string;
  assetId: string;
  expectedLocation: string | null;
  actualLocation: string | null;
  verdict: string | null;
  discrepancy: string | null;
  notes: string | null;
  assetTag: string;
  assetName: string;
  assetStatus: string;
  assetLocation: string | null;
};

type Cycle = {
  id: string;
  title: string;
  description: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  conductedBy: string | null;
  auditorIds: string[] | null;
  notes: string | null;
  items: AuditItem[];
};

export default function AuditDetailPage() {
  const { id } = useParams();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [saving, setSaving] = useState(false);
  const role = useAuthStore((s) => s.user?.role);
  const [editing, setEditing] = useState<AuditItem | null>(null);

  const fetchCycle = useCallback(async () => {
    try {
      const r = await api.get(`/audits/${id}`);
      setCycle(r.data.data);
    } catch {
      showToast("Failed to load audit", "error");
    }
  }, [id]);

  useEffect(() => { fetchCycle(); }, [fetchCycle]);

  const action = async (endpoint: string, successMsg: string) => {
    setSaving(true);
    try {
      await api.post(`/audits/${id}${endpoint}`);
      showToast(successMsg, "success");
      fetchCycle();
    } catch (err: unknown) {
      const errMsg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(errMsg, "error");
    } finally { setSaving(false); }
  };

  const handlePopulate = async () => {
    setSaving(true);
    try {
      const r = await api.post(`/audits/${id}/populate`);
      const count = r.data?.data?.count ?? 0;
      if (count === 0) {
        showToast("No assets matched the scope criteria. Check the department/location filter.", "error");
      } else {
        showToast(`${count} asset(s) added to the audit`, "success");
      }
      fetchCycle();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed to populate items";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  // Export ALL items (not just discrepancies) as CSV
  const handleExportAll = () => {
    if (!cycle?.items?.length) { showToast("No items to export", "error"); return; }
    const header = "Tag,Asset,Expected Location,Actual Location,Verdict,Discrepancy,Notes";
    const rows = cycle.items.map((item) =>
      [item.assetTag, item.assetName, item.expectedLocation, item.actualLocation, item.verdict, item.discrepancy, item.notes]
        .map((v) => `"${v ?? ""}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-${cycle.title.replace(/\s+/g, "_")}-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export only discrepancies
  const handleExportDiscrepancies = async () => {
    try {
      const r = await api.get(`/audits/${id}/discrepancies`);
      if (r.data.data.length === 0) { showToast("No discrepancies found", "success"); return; }
      const header = "Tag,Asset,Expected Location,Actual Location,Verdict,Discrepancy,Notes";
      const rows = r.data.data.map((d: Record<string, unknown>) =>
        [d.assetTag, d.assetName, d.expectedLocation, d.actualLocation, d.verdict, d.discrepancy, d.notes]
          .map((v) => `"${v ?? ""}"`)
          .join(",")
      );
      const csv = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `discrepancies-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { showToast("Failed", "error"); }
  };

  const isAdminMgr = isAssetManager(role);
  const isActive = !cycle?.status?.match(/completed|cancelled/);

  const cols: Column<AuditItem>[] = [
    { key: "assetTag", label: "Tag", render: (r) => <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{r.assetTag}</span> },
    { key: "assetName", label: "Asset" },
    { key: "expectedLocation", label: "Expected Location", render: (r) => r.expectedLocation ?? <span style={{ color: "var(--color-text-muted)" }}>—</span> },
    { key: "actualLocation", label: "Actual Location", render: (r) => r.actualLocation ?? <span style={{ color: "var(--color-text-muted)" }}>—</span> },
    { key: "verdict", label: "Verdict", render: (r) => r.verdict ? <StatusBadge status={r.verdict} /> : <span style={{ color: "var(--color-text-muted)" }}>Pending</span> },
    { key: "discrepancy", label: "Discrepancy / Notes", render: (r) => {
      const parts = [r.discrepancy, r.notes].filter(Boolean).join(" — ");
      return parts ? <span style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{parts}</span> : <span style={{ color: "var(--color-text-muted)" }}>—</span>;
    }},
    {
      key: "actions", label: "", render: (r) =>
        isAdminMgr && isActive && (cycle?.status === "in_progress" || cycle?.status === "planned") ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
            {r.verdict ? "Edit Verdict" : "Review"}
          </Button>
        ) : null
    },
  ];

  if (!cycle) return <PageLoader />;

  const totalItems = cycle.items.length;
  const reviewed   = cycle.items.filter((i) => i.verdict).length;
  const discrepancies = cycle.items.filter((i) => i.verdict && i.verdict !== "found").length;

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div className="flex gap-sm" style={{ alignItems: "center", marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>{cycle.title}</h2>
            <StatusBadge status={cycle.status} />
          </div>
          <div className="flex gap-sm" style={{ fontSize: 13, color: "var(--color-text-muted)", flexWrap: "wrap", alignItems: "center" }}>
            {cycle.plannedStart && <span>📅 {cycle.plannedStart} → {cycle.plannedEnd ?? "TBD"}</span>}
            {cycle.description && <span style={{ color: "var(--color-text-secondary)" }}>· {cycle.description}</span>}
          </div>
        </div>
        <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
          {cycle.status === "planned" && isAdminMgr && (
            <Button variant="secondary" onClick={handlePopulate} loading={saving}>🗂 Populate Items</Button>
          )}
          {cycle.status === "planned" && isAdminMgr && (
            <Button onClick={() => action("/start", "Audit started — recording verdicts can begin")} loading={saving}>▶ Start Audit</Button>
          )}
          {(cycle.status === "in_progress" || cycle.status === "completed") && isAdminMgr && (
            <Button variant="secondary" onClick={handleExportDiscrepancies} loading={saving}>⚠ Discrepancy Report</Button>
          )}
          {(cycle.status === "in_progress" || cycle.status === "completed") && isAdminMgr && (
            <Button variant="secondary" onClick={handleExportAll}>⬇ Export CSV</Button>
          )}
          {cycle.status === "in_progress" && isAdminMgr && (
            <Button onClick={() => action("/complete", "Audit closed — discrepant assets updated")} loading={saving}>✓ Close Audit</Button>
          )}
          {isActive && isAdminMgr && (
            <Button variant="secondary" onClick={() => action("/cancel", "Audit cancelled")} loading={saving}>Cancel</Button>
          )}
        </div>
      </div>

      {/* Stat pills */}
      {totalItems > 0 && (
        <div className="flex gap-sm" style={{ marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ background: "var(--color-primary-light)", color: "var(--color-primary)", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
            {totalItems} In Scope
          </span>
          <span style={{ background: "var(--color-info-light)", color: "var(--color-info)", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
            {reviewed} Reviewed
          </span>
          {discrepancies > 0 && (
            <span style={{ background: "#FEF2F2", color: "var(--color-error)", borderRadius: 999, padding: "4px 14px", fontSize: 13, fontWeight: 600 }}>
              {discrepancies} Discrepanc{discrepancies === 1 ? "y" : "ies"}
            </span>
          )}
          {cycle.startedAt && (
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", padding: "4px 0" }}>
              ▶ Started {new Date(cycle.startedAt).toLocaleString()}
            </span>
          )}
          {cycle.completedAt && (
            <span style={{ fontSize: 13, color: "var(--color-secondary)", padding: "4px 0", fontWeight: 600 }}>
              ✅ Closed {new Date(cycle.completedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Table or empty state */}
      <Card>
        {totalItems === 0 ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontWeight: 600, fontSize: 15, color: "var(--color-text)" }}>No items in scope yet</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 6 }}>
              {cycle.status === "planned"
                ? "Click \"Populate Items\" to add all non-retired assets to this audit."
                : "No assets were added to this audit cycle."}
            </p>
          </div>
        ) : (
          <Table columns={cols} data={cycle.items} />
        )}
      </Card>

      {editing && (
        <VerdictModal
          item={editing}
          onClose={() => setEditing(null)}
          onDone={() => { setEditing(null); fetchCycle(); }}
        />
      )}
    </div>
  );
}

function VerdictModal({ item, onClose, onDone }: { item: AuditItem; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    verdict: item.verdict ?? "",
    actualLocation: item.actualLocation ?? "",
    discrepancy: item.discrepancy ?? "",
    notes: item.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/audits/items/${item.id}/verdict`, form);
      showToast("Verdict saved", "success");
      onDone();
    } catch { showToast("Failed to save verdict", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Review: ${item.assetTag} — ${item.assetName}`}>
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Select
          label="Verdict"
          value={form.verdict}
          onChange={(e) => setForm({ ...form, verdict: e.target.value })}
          required
          options={[
            { value: "", label: "— Select —" },
            { value: "found", label: "Found" },
            { value: "missing", label: "Missing" },
            { value: "damaged", label: "Damaged" },
            { value: "mismatched", label: "Mismatched" },
          ]}
        />
        <Input
          label="Actual Location"
          value={form.actualLocation}
          onChange={(e) => setForm({ ...form, actualLocation: e.target.value })}
          placeholder="Where was the asset physically found?"
        />
        <Input
          label="Discrepancy"
          value={form.discrepancy}
          onChange={(e) => setForm({ ...form, discrepancy: e.target.value })}
          placeholder="Brief description of the issue (if any)"
        />
        <Input
          label="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Additional notes for the auditor"
        />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Verdict</Button>
        </div>
      </form>
    </Modal>
  );
}
