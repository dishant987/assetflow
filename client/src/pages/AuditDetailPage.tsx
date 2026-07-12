import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button, Input, Select, Table, Card, StatusBadge, showToast, Modal } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";

type AuditItem = {
  id: number;
  assetId: number;
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
  id: number;
  title: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  items: AuditItem[];
};

export default function AuditDetailPage() {
  const { id } = useParams();
  const [cycle, setCycle] = useState<Cycle | null>(null);
  const [saving, setSaving] = useState(false);
  const role = useAuthStore((s) => s.user?.role);

  const fetchCycle = useCallback(async () => {
    try { const r = await api.get(`/audits/${id}`); setCycle(r.data.data); } catch { showToast("Failed to load audit", "error"); }
  }, [id]);

  useEffect(() => { fetchCycle(); }, [fetchCycle]);

  const action = async (endpoint: string, msg: string) => {
    setSaving(true);
    try { await api.post(`/audits/${id}${endpoint}`); showToast(msg, "success"); fetchCycle(); } catch { showToast("Failed", "error"); } finally { setSaving(false); }
  };

  const isAdminMgr = role === "admin" || role === "manager";

  const cols: Column<AuditItem>[] = [
    { key: "assetTag", label: "Tag", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.assetTag}</span> },
    { key: "assetName", label: "Asset" },
    { key: "expectedLocation", label: "Expected Location" },
    { key: "actualLocation", label: "Actual Location" },
    { key: "verdict", label: "Verdict", render: (r) => r.verdict ? <StatusBadge status={r.verdict} /> : <span style={{ color: "var(--color-text-muted)" }}>—</span> },
    { key: "discrepancy", label: "Discrepancy" },
    { key: "actions", label: "", render: (r) => isAdminMgr && !cycle?.status.match(/completed|cancelled/) && (!r.verdict || cycle?.status === "in_progress") ? (
      <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Review</Button>
    ) : null },
  ];

  const [editing, setEditing] = useState<AuditItem | null>(null);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>{cycle?.title ?? "Loading..."}</h2>
          {cycle && <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Status: <StatusBadge status={cycle.status} /></span>}
        </div>
        <div className="flex gap-sm">
          {cycle?.status === "planned" && isAdminMgr && <Button onClick={() => action("/start", "Audit started")} loading={saving}>Start Audit</Button>}
          {cycle?.status === "in_progress" && isAdminMgr && <Button onClick={() => action("/complete", "Audit completed")} loading={saving}>Complete Audit</Button>}
          {!cycle?.status.match(/completed|cancelled/) && isAdminMgr && <Button variant="secondary" onClick={() => action("/cancel", "Audit cancelled")} loading={saving}>Cancel</Button>}
        </div>
      </div>
      {cycle?.description && <p style={{ marginBottom: 16, color: "var(--color-text-secondary)" }}>{cycle.description}</p>}
      <Card><Table columns={cols} data={cycle?.items ?? []} /></Card>
      {editing && (
        <VerdictModal item={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); fetchCycle(); }} />
      )}
    </div>
  );
}

function VerdictModal({ item, onClose, onDone }: { item: AuditItem; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ verdict: item.verdict ?? "", actualLocation: item.actualLocation ?? "", discrepancy: item.discrepancy ?? "", notes: item.notes ?? "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/audits/items/${item.id}/verdict`, form);
      showToast("Verdict saved", "success");
      onDone();
    } catch { showToast("Failed", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Review: ${item.assetTag} — ${item.assetName}`}>
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Select label="Verdict" value={form.verdict} onChange={(e) => setForm({ ...form, verdict: e.target.value })} required options={[
          { value: "", label: "— Select —" },
          { value: "found", label: "Found" },
          { value: "missing", label: "Missing" },
          { value: "damaged", label: "Damaged" },
          { value: "mismatched", label: "Mismatched" },
        ]} />
        <Input label="Actual Location" value={form.actualLocation} onChange={(e) => setForm({ ...form, actualLocation: e.target.value })} />
        <Input label="Discrepancy" value={form.discrepancy} onChange={(e) => setForm({ ...form, discrepancy: e.target.value })} />
        <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Verdict</Button>
        </div>
      </form>
    </Modal>
  );
}
