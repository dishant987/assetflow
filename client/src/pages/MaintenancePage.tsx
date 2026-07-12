import { useEffect, useState, useCallback } from "react";
import { Button, Input, Select, Table, Card, StatusBadge, Badge, Modal, showToast, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";

type Maint = {
  id: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  requestedBy: number;
  requesterName: string;
  issueDescription: string;
  photoUrl: string | null;
  priority: string;
  status: string;
  scheduledAt: string | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
};

const statusFlow: Record<string, string[]> = {
  reported: ["approved"],
  approved: ["in_progress"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
};

export default function MaintenancePage() {
  const [items, setItems] = useState<Maint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRaise, setShowRaise] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/maintenance"); setItems(data.data); } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try { await api.patch(`/maintenance/${id}/status`, { status }); showToast(`Status updated to ${status}`, "success"); fetchItems(); } catch (err: unknown) { showToast(String(err), "error"); }
  };

  const cols: Column<Maint>[] = [
    { key: "assetTag", label: "Asset", sortable: true, render: (m) => <strong>{m.assetTag}</strong> },
    { key: "issueDescription", label: "Issue" },
    { key: "priority", label: "Priority", render: (m) => <Badge variant={m.priority === "critical" ? "error" : m.priority === "high" ? "warning" : m.priority === "medium" ? "info" : "muted"}>{m.priority}</Badge> },
    { key: "requesterName", label: "Reported By" },
    { key: "status", label: "Status", render: (m) => <StatusBadge status={m.status} /> },
    {
      key: "actions", label: "", render: (m) => {
        const next = statusFlow[m.status] ?? [];
        if (next.length === 0 || (user?.role !== "admin" && user?.role !== "manager")) return null;
        return (
          <div className="flex gap-xs">
            {next.map((s) => <Button key={s} variant="ghost" size="sm" onClick={() => handleStatusUpdate(m.id, s)}>{s.replace("_", " ")}</Button>)}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex" style={{ justifyContent: "flex-end" }}>
        <Button onClick={() => setShowRaise(true)}>+ Raise Request</Button>
      </div>

      <Card>
        {loading ? <PageLoader /> : items.length === 0 ? <EmptyState title="No maintenance requests" description="Raise a request to report an issue." /> : <Table columns={cols} data={items} />}
      </Card>

      {showRaise && <RaiseModal onClose={() => setShowRaise(false)} onDone={() => { setShowRaise(false); fetchItems(); }} />}
    </div>
  );
}

function RaiseModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ assetTag: "", issueDescription: "", priority: "medium" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const handleRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const asset = await api.get(`/assets?search=${form.assetTag}`);
      if (!asset.data.data.length) { showToast("Asset not found", "error"); setSaving(false); return; }
      let photoUrl = "";
      if (photoFile) {
        const fd = new FormData(); fd.append("file", photoFile);
        const up = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        photoUrl = up.data.data.url;
      }
      await api.post("/maintenance", { assetId: asset.data.data[0].id, issueDescription: form.issueDescription, priority: form.priority, photoUrl });
      showToast("Maintenance request raised", "success");
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Raise Maintenance Request">
      <form onSubmit={handleRaise} className="flex flex-col gap-md">
        <Input label="Asset Tag" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} required placeholder="e.g. AF-0114" />
        <Input label="Issue Description" value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} required />
        <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} required options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "critical", label: "Critical" }]} />
        <div className="field">
          <label className="field-label">Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Submit</Button>
        </div>
      </form>
    </Modal>
  );
}
