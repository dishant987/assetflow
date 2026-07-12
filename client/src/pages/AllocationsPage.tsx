import { useEffect, useState, useCallback } from "react";
import { Button, Input, Table, Card, StatusBadge, Modal, showToast } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";

type Allocation = {
  id: number;
  assetId: number;
  assetTag: string;
  assetName: string;
  employeeId: number;
  employeeName: string;
  departmentId: number | null;
  departmentName: string | null;
  allocatedAt: string;
  returnedAt: string | null;
  status: string;
  notes: string | null;
};

type TransferReq = { id: number; assetId: number; assetTag: string; fromEmployeeName: string; toEmployeeName: string; status: string; requestedAt: string };

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<TransferReq[]>([]);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showReturn, setShowReturn] = useState<Allocation | null>(null);
  const [showTransfer, setShowTransfer] = useState<{ assetTag: string; allocationId: number } | null>(null);
  const [tab, setTab] = useState<"allocations" | "transfers">("allocations");
  const user = useAuthStore((s) => s.user);

  const fetchAll = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([api.get("/allocations"), api.get("/transfers")]);
      setAllocations(a.data.data);
      setTransfers(t.data.data);
    } catch { /* */ }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const cols: Column<Allocation>[] = [
    { key: "assetTag", label: "Asset", sortable: true },
    { key: "assetName", label: "Name" },
    { key: "employeeName", label: "Allocated To" },
    { key: "departmentName", label: "Department" },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
    {
      key: "actions", label: "", render: (a) =>
        a.status === "active" ? (
          <div className="flex gap-xs">
            <Button variant="ghost" size="sm" onClick={() => setShowReturn(a)}>Return</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTransfer({ assetTag: a.assetTag, allocationId: a.id })}>Transfer</Button>
          </div>
        ) : null,
    },
  ];

  const transferCols: Column<TransferReq>[] = [
    { key: "assetTag", label: "Asset" },
    { key: "fromEmployeeName", label: "From" },
    { key: "toEmployeeName", label: "To" },
    { key: "status", label: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "actions", label: "", render: (t) =>
        t.status === "pending" && (user?.role === "admin" || user?.role === "manager") ? (
          <div className="flex gap-xs">
            <Button variant="ghost" size="sm" onClick={() => handleTransferAction(t.id, "approve")}>Approve</Button>
            <Button variant="ghost" size="sm" onClick={() => handleTransferAction(t.id, "reject")}>Reject</Button>
          </div>
        ) : null,
    },
  ];

  async function handleTransferAction(id: number, action: "approve" | "reject") {
    try { await api.post(`/transfers/${id}/${action}`); showToast(`Transfer ${action}d`, "success"); fetchAll(); } catch (err: unknown) { showToast(String(err), "error"); }
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-sm" style={{ alignItems: "center" }}>
        <Button variant={tab === "allocations" ? "primary" : "ghost"} size="sm" onClick={() => setTab("allocations")}>Allocations</Button>
        <Button variant={tab === "transfers" ? "primary" : "ghost"} size="sm" onClick={() => setTab("transfers")}>Transfer Requests</Button>
        <div style={{ flex: 1 }} />
        <Button onClick={() => setShowAllocate(true)}>+ Allocate Asset</Button>
      </div>

      <Card>
        {tab === "allocations" ? <Table columns={cols} data={allocations} /> : <Table columns={transferCols} data={transfers} />}
      </Card>

      {showAllocate && <AllocateModal onClose={() => setShowAllocate(false)} onDone={() => { setShowAllocate(false); fetchAll(); }} onTransfer={(tag, allocId) => { setShowAllocate(false); setShowTransfer({ assetTag: tag, allocationId: allocId }); }} />}
      {showReturn && <ReturnModal allocation={showReturn} onClose={() => setShowReturn(null)} onDone={() => { setShowReturn(null); fetchAll(); }} />}
      {showTransfer && <TransferModal {...showTransfer} onClose={() => setShowTransfer(null)} onDone={() => { setShowTransfer(null); fetchAll(); }} />}
    </div>
  );
}

function AllocateModal({ onClose, onDone, onTransfer }: { onClose: () => void; onDone: () => void; onTransfer?: (tag: string, allocId: number) => void }) {
  const [form, setForm] = useState({ assetTag: "", employeeId: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ msg: string; allocationId: number } | null>(null);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setConflict(null);
    try {
      const asset = await api.get(`/assets?search=${form.assetTag}`);
      if (!asset.data.data.length) { showToast("Asset not found", "error"); setSaving(false); return; }
      await api.post("/allocations", { assetId: asset.data.data[0].id, employeeId: Number(form.employeeId), notes: form.notes });
      showToast("Allocated successfully", "success");
      onDone();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code: string; message: string; fields?: Record<string, string> } } } };
      if (e?.response?.data?.error?.code === "ASSET_ALREADY_ALLOCATED") {
        setConflict({ msg: e.response.data.error.message, allocationId: Number(e.response.data.error.fields?.allocationId ?? 0) });
      } else {
        showToast(e?.response?.data?.error?.message ?? "Allocation failed", "error");
      }
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Allocate Asset">
      {conflict ? (
        <div>
          <p style={{ color: "var(--color-error)", marginBottom: 16 }}>{conflict.msg}</p>
          <Button onClick={() => { onTransfer?.(form.assetTag, conflict.allocationId); }}>Request Transfer</Button>
        </div>
      ) : (
        <form onSubmit={handleAllocate} className="flex flex-col gap-md">
          <Input label="Asset Tag" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} required placeholder="e.g. AF-0114" />
          <Input label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="modal-footer" style={{ padding: 0, border: "none" }}>
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving}>Allocate</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ReturnModal({ allocation, onClose, onDone }: { allocation: Allocation; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const handleReturn = async () => {
    setSaving(true);
    try { await api.post(`/allocations/${allocation.id}/return`, { notes }); showToast("Asset returned", "success"); onDone(); } catch { showToast("Return failed", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Return ${allocation.assetTag}`}>
      <p style={{ marginBottom: 16 }}>Returning from <strong>{allocation.employeeName}</strong></p>
      <Input label="Condition Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <div className="modal-footer">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleReturn} loading={saving}>Confirm Return</Button>
      </div>
    </Modal>
  );
}

function TransferModal({ assetTag, onClose, onDone }: { assetTag: string; allocationId: number; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ toEmployeeId: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const asset = await api.get(`/assets?search=${assetTag}`);
      const alloc = await api.get(`/allocations`);
      const activeAlloc = alloc.data.data.find((a: Allocation) => a.assetTag === assetTag && a.status === "active");
      if (!activeAlloc) { showToast("No active allocation found", "error"); setSaving(false); return; }
      await api.post("/transfers", { assetId: asset.data.data[0].id, fromEmployeeId: activeAlloc.employeeId, toEmployeeId: Number(form.toEmployeeId), notes: form.notes });
      showToast("Transfer requested", "success");
      onDone();
    } catch { showToast("Transfer failed", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Transfer ${assetTag}`}>
      <form onSubmit={handleTransfer} className="flex flex-col gap-md">
        <Input label="To Employee ID" value={form.toEmployeeId} onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value })} required />
        <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Request Transfer</Button>
        </div>
      </form>
    </Modal>
  );
}
