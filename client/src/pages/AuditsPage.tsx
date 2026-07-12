import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, Table, Card, StatusBadge, showToast, Modal, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";

type Employee = { id: string; firstName: string; lastName: string };

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
  notes: string | null;
  createdAt: string;
  itemCount: number;
};

export default function AuditsPage() {
  const [items, setItems] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const nav = useNavigate();

  const fetchItems = async () => {
    setLoading(true);
    try { const r = await api.get("/audits"); setItems(r.data.data); } catch { showToast("Failed to load audits", "error"); }
    finally { setLoading(false); }
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
      <Card>{loading ? <PageLoader /> : items.length === 0 ? <EmptyState title="No audit cycles yet" description="Create a new audit to get started." /> : <Table columns={cols} data={items} />}</Card>
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); fetchItems(); }} />}
    </div>
  );
}

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", plannedStart: "", plannedEnd: "", conductedBy: "", scopeDepartmentId: "", scopeLocation: "", auditorIdsStr: "" });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/employees").then((r) => setEmployees(r.data.data)).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { title: form.title, description: form.description };
      if (form.plannedStart) payload.plannedStart = form.plannedStart;
      if (form.plannedEnd) payload.plannedEnd = form.plannedEnd;
      if (form.conductedBy) payload.conductedBy = form.conductedBy;
      if (form.scopeDepartmentId) payload.scopeDepartmentId = form.scopeDepartmentId;
      if (form.scopeLocation) payload.scopeLocation = form.scopeLocation;
      const auditorIds = form.auditorIdsStr ? form.auditorIdsStr.split(",").map(s => s.trim()).filter(Boolean) : [];
      if (auditorIds.length) payload.auditorIds = auditorIds;
      const r = await api.post("/audits", payload);
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
        <Input label="Planned Start" type="date" value={form.plannedStart} onChange={(e) => setForm({ ...form, plannedStart: e.target.value })} />
        <Input label="Planned End" type="date" value={form.plannedEnd} onChange={(e) => setForm({ ...form, plannedEnd: e.target.value })} />
        <Select label="Assign Auditor" value={form.conductedBy} onChange={(e) => setForm({ ...form, conductedBy: e.target.value })} placeholder="— Select —" options={employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` }))} />
        <Input label="Scope Department" value={form.scopeDepartmentId} onChange={(e) => setForm({...form, scopeDepartmentId: e.target.value})} placeholder="Department ID" />
        <Input label="Scope Location" value={form.scopeLocation} onChange={(e) => setForm({...form, scopeLocation: e.target.value})} placeholder="e.g. Floor 2, Building A" />
        <Input label="Auditor IDs (comma-separated)" value={form.auditorIdsStr} onChange={(e) => setForm({...form, auditorIdsStr: e.target.value})} placeholder="uuid1, uuid2, uuid3" />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create & Populate</Button>
        </div>
      </form>
    </Modal>
  );
}
