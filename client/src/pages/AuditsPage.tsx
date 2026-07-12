import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Table, Card, StatusBadge, showToast, Modal } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";

type Cycle = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  conductedBy: number | null;
  notes: string | null;
  createdAt: string;
  itemCount: number;
};

export default function AuditsPage() {
  const [items, setItems] = useState<Cycle[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const nav = useNavigate();

  const fetchItems = async () => {
    try { const r = await api.get("/audits"); setItems(r.data.data); } catch { showToast("Failed to load audits", "error"); }
  };

  useEffect(() => { fetchItems(); }, []);

  const cols: Column<Cycle>[] = [
    { key: "id", label: "#", sortable: true },
    { key: "title", label: "Title", sortable: true, render: (r) => <a href={`/audits/${r.id}`} onClick={(e) => { e.preventDefault(); nav(`/audits/${r.id}`); }} style={{ color: "var(--color-primary)", cursor: "pointer" }}>{r.title}</a> },
    { key: "itemCount", label: "Items", sortable: true },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "startedAt", label: "Started", render: (r) => r.startedAt ? new Date(r.startedAt).toLocaleDateString() : "—" },
    { key: "completedAt", label: "Completed", render: (r) => r.completedAt ? new Date(r.completedAt).toLocaleDateString() : "—" },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h2>Audit Cycles</h2>
        <Button onClick={() => setShowCreate(true)}>New Audit</Button>
      </div>
      <Card><Table columns={cols} data={items} /></Card>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); fetchItems(); }} />}
    </div>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.post("/audits", form);
      await api.post(`/audits/${r.data.data.id}/populate`);
      showToast("Audit created with all active assets", "success");
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Audit Cycle">
      <form onSubmit={handleCreate} className="flex flex-col gap-md">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create & Populate</Button>
        </div>
      </form>
    </Modal>
  );
}
