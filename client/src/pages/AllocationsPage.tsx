import { useEffect, useState, useCallback } from "react";
import { Button, Input, Table, Card, StatusBadge, Modal, showToast, PageLoader, EmptyState, Select } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";

type Allocation = {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  employeeId: string;
  employeeName: string;
  departmentId: string | null;
  departmentName: string | null;
  allocatedAt: string;
  returnedAt: string | null;
  status: string;
  notes: string | null;
};

type TransferReq = { id: string; assetId: string; assetTag: string; fromEmployeeName: string; toEmployeeName: string; status: string; requestedAt: string };

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [transfers, setTransfers] = useState<TransferReq[]>([]);
  const [employees, setEmployees] = useState<{ id: string; firstName: string; lastName: string; employeeCode: string; role: string }[]>([]);
  const [assetsList, setAssetsList] = useState<{ id: string; name: string; assetTag: string; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllocate, setShowAllocate] = useState(false);
  const [showReturn, setShowReturn] = useState<Allocation | null>(null);
  const [showTransfer, setShowTransfer] = useState<{ assetTag: string; allocationId: string } | null>(null);
  const [showTransferAction, setShowTransferAction] = useState<{ req: TransferReq; action: "approve" | "reject" } | null>(null);
  const [tab, setTab] = useState<"allocations" | "transfers">("allocations");
  const user = useAuthStore((s) => s.user);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const a = await api.get("/allocations");
      setAllocations(a.data.data);
    } catch (err) { console.error("Failed to load allocations", err); }

    try {
      const t = await api.get("/transfers");
      setTransfers(t.data.data);
    } catch (err) { console.error("Failed to load transfers", err); }

    try {
      const e = await api.get("/employees");
      setEmployees(e.data.data);
    } catch (err) { console.error("Failed to load employees", err); }

    try {
      const ast = await api.get("/assets");
      setAssetsList(ast.data.data);
    } catch (err) { console.error("Failed to load assets", err); }

    setLoading(false);
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
            {(user?.role === "admin" || user?.role === "manager") && (
              <Button variant="ghost" size="sm" onClick={() => setShowReturn(a)}>Return</Button>
            )}
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
    { key: "requestedAt", label: "Requested", render: (t) => new Date(t.requestedAt).toLocaleString() },
    {
      key: "actions", label: "", render: (t) =>
        t.status === "pending" && (user?.role === "admin" || user?.role === "manager" || user?.role === "department_head") ? (
          <div className="flex gap-xs">
            <Button variant="ghost" size="sm" onClick={() => setShowTransferAction({ req: t, action: "approve" })}>Approve</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowTransferAction({ req: t, action: "reject" })}>Reject</Button>
          </div>
        ) : null,
    },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-sm" style={{ alignItems: "center" }}>
        <Button variant={tab === "allocations" ? "primary" : "ghost"} size="sm" onClick={() => setTab("allocations")}>Allocations</Button>
        <Button variant={tab === "transfers" ? "primary" : "ghost"} size="sm" onClick={() => setTab("transfers")}>Transfer Requests</Button>
        <div style={{ flex: 1 }} />
        {(user?.role === "admin" || user?.role === "manager") && (
          <Button onClick={() => setShowAllocate(true)}>+ Allocate Asset</Button>
        )}
      </div>

      <Card>
        {loading ? <PageLoader /> : tab === "allocations" ? (
          allocations.length === 0 ? <EmptyState title="No allocations yet" description="Allocate an asset to get started." /> : <Table columns={cols} data={allocations} />
        ) : (
          transfers.length === 0 ? <EmptyState title="No transfer requests" description="Pending transfers will appear here." /> : <Table columns={transferCols} data={transfers} />
        )}
      </Card>

      {showAllocate && (
        <AllocateModal
          employees={employees}
          assetsList={assetsList}
          onClose={() => setShowAllocate(false)}
          onDone={() => { setShowAllocate(false); fetchAll(); }}
          onTransfer={(tag, allocId) => { setShowAllocate(false); setShowTransfer({ assetTag: tag, allocationId: allocId }); }}
        />
      )}
      {showReturn && <ReturnModal allocation={showReturn} onClose={() => setShowReturn(null)} onDone={() => { setShowReturn(null); fetchAll(); }} />}
      {showTransfer && (
        <TransferModal
          {...showTransfer}
          employees={employees}
          onClose={() => setShowTransfer(null)}
          onDone={() => { setShowTransfer(null); fetchAll(); }}
        />
      )}
      {showTransferAction && (
        <ApproveRejectModal
          transferReq={showTransferAction.req}
          action={showTransferAction.action}
          onClose={() => setShowTransferAction(null)}
          onDone={() => {
            setShowTransferAction(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}

function AllocateModal({
  employees,
  assetsList,
  onClose,
  onDone,
  onTransfer
}: {
  employees: { id: string; firstName: string; lastName: string; employeeCode: string; role: string }[];
  assetsList: { id: string; name: string; assetTag: string; status: string }[];
  onClose: () => void;
  onDone: () => void;
  onTransfer?: (tag: string, allocId: string) => void;
}) {
  const [form, setForm] = useState({ assetTag: "", employeeId: "", notes: "", expectedReturnAt: "" });
  const [saving, setSaving] = useState(false);
  const [conflict, setConflict] = useState<{ msg: string; allocationId: string } | null>(null);

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setConflict(null);
    try {
      const asset = await api.get(`/assets?search=${form.assetTag}`);
      if (!asset.data.data.length) { showToast("Asset not found", "error"); setSaving(false); return; }
      const payload: Record<string, unknown> = { assetId: asset.data.data[0].id, employeeId: form.employeeId, notes: form.notes };
      if (form.expectedReturnAt) payload.expectedReturnAt = form.expectedReturnAt;
      await api.post("/allocations", payload);
      showToast("Allocated successfully", "success");
      onDone();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code: string; message: string; fields?: Record<string, string> } } } };
      if (e?.response?.data?.error?.code === "ASSET_ALREADY_ALLOCATED") {
        setConflict({ msg: e.response.data.error.message, allocationId: String(e.response.data.error.fields?.allocationId ?? "") });
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
          <Select
            label="Asset"
            value={form.assetTag}
            onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
            required
            placeholder="Select Asset..."
            options={assetsList
              .filter((a) => a.status === "available")
              .map((asset) => ({
                value: asset.assetTag,
                label: `${asset.name} (${asset.assetTag})`
              }))}
          />
          <Select
            label="Employee"
            value={form.employeeId}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            required
            placeholder="Select Employee..."
            options={employees.filter((e) => e.role !== "admin").map((emp) => ({
              value: emp.id,
              label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`
            }))}
          />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <Input label="Expected Return" type="date" value={form.expectedReturnAt} onChange={(e) => setForm({ ...form, expectedReturnAt: e.target.value })} />
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

function TransferModal({ assetTag, employees, onClose, onDone }: { assetTag: string; allocationId: string; employees: { id: string; firstName: string; lastName: string; employeeCode: string; role: string }[]; onClose: () => void; onDone: () => void }) {
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
      await api.post("/transfers", { assetId: asset.data.data[0].id, fromEmployeeId: activeAlloc.employeeId, toEmployeeId: form.toEmployeeId, notes: form.notes });
      showToast("Transfer requested", "success");
      onDone();
    } catch { showToast("Transfer failed", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Transfer ${assetTag}`}>
      <form onSubmit={handleTransfer} className="flex flex-col gap-md">
        <Select
          label="To Employee"
          value={form.toEmployeeId}
          onChange={(e) => setForm({ ...form, toEmployeeId: e.target.value })}
          required
          placeholder="Select Employee..."
          options={employees.filter((e) => e.role !== "admin").map((emp) => ({
            value: emp.id,
            label: `${emp.firstName} ${emp.lastName} (${emp.employeeCode})`
          }))}
        />
        <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Request Transfer</Button>
        </div>
      </form>
    </Modal>
  );
}

function ApproveRejectModal({
  transferReq,
  action,
  onClose,
  onDone,
}: {
  transferReq: TransferReq;
  action: "approve" | "reject";
  onClose: () => void;
  onDone: () => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleAction = async () => {
    setSaving(true);
    try {
      await api.post(`/transfers/${transferReq.id}/${action}`);
      showToast(`Transfer request ${action === "approve" ? "approved" : "rejected"}`, "success");
      onDone();
    } catch (err: unknown) {
      showToast(String(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const title = action === "approve" ? "Approve Transfer" : "Reject Transfer";

  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col gap-md">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Are you sure you want to {action} the transfer request for asset <strong>{transferReq.assetTag}</strong>?
        </p>

        <div
          style={{
            background: "var(--color-muted-light, #f3f4f6)",
            padding: "16px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "8px",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>Asset Tag:</span>
            <strong style={{ color: "var(--color-text)" }}>{transferReq.assetTag}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>From:</span>
            <strong style={{ color: "var(--color-text)" }}>{transferReq.fromEmployeeName}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>To:</span>
            <strong style={{ color: "var(--color-text)" }}>{transferReq.toEmployeeName}</strong>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: 0, border: "none", marginTop: "16px" }}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant={action === "approve" ? "primary" : "danger"}
            onClick={handleAction}
            loading={saving}
          >
            {action === "approve" ? "Approve" : "Reject"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
