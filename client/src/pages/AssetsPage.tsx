import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Input, Select, Table, Card, StatusBadge, showToast, Modal, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";

type Asset = {
  id: string;
  assetTag: string;
  name: string;
  categoryId: string;
  categoryName: string;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  status: string;
  photoUrl: string | null;
  location: string | null;
  bookable: number;
  qrCodeValue: string;
  purchaseDate: string | null;
  purchaseCost: string | null;
  createdAt: string;
};

type Category = { id: string; name: string; code: string };

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const nav = useNavigate();

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("categoryId", categoryFilter);
      const { data } = await api.get(`/assets?${params}`);
      setAssets(data.data);
    } catch { /* toast handled by interceptor */ }
    finally { setLoading(false); }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  async function fetchCategories() {
    try { const { data } = await api.get("/asset-categories"); setCategories(data.data); } catch { }
  }

  const columns: Column<Asset>[] = [
    { key: "assetTag", label: "Asset Tag", sortable: true, render: (a) => <strong>{a.assetTag}</strong> },
    { key: "name", label: "Name", sortable: true },
    { key: "categoryName", label: "Category" },
    { key: "status", label: "Status", render: (a) => <StatusBadge status={a.status} /> },
    { key: "location", label: "Location" },
    { key: "serialNumber", label: "Serial #" },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-sm" style={{ flexWrap: "wrap", alignItems: "flex-end" }}>
        <div style={{ flex: "1 1 200px" }}>
          <Input label="Search" placeholder="Tag, name, serial, QR..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div style={{ minWidth: 140 }}>
          <Select label="Status" options={[{ value: "", label: "All" }, { value: "available", label: "Available" }, { value: "allocated", label: "Allocated" }, { value: "under_maintenance", label: "Under Maintenance" }, { value: "retired", label: "Retired" }, { value: "lost", label: "Lost" }]} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} />
        </div>
        <div style={{ minWidth: 140 }}>
          <Select label="Category" options={[{ value: "", label: "All" }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
        </div>
        <Button onClick={() => setShowRegister(true)}>+ Register Asset</Button>
      </div>

      <Card>
        {loading ? <PageLoader /> : assets.length === 0 ? <EmptyState title="No assets yet" description="Register your first asset to get started." /> : <Table columns={columns} data={assets} />}
      </Card>

      <div className="flex" style={{ justifyContent: "flex-end" }}>
        <Button variant="ghost" size="sm" onClick={() => nav("/notifications")}>🔔 Notifications</Button>
      </div>

      {showRegister && <RegisterModal categories={categories} onClose={() => setShowRegister(false)} onSaved={() => { setShowRegister(false); fetchAssets(); }} />}
    </div>
  );
}

function RegisterModal({ categories, onClose, onSaved }: { categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: "", categoryId: "", serialNumber: "", model: "", manufacturer: "",
    purchaseDate: "", purchaseCost: "", warrantyExpiry: "", location: "", notes: "", description: "", condition: "", bookable: false,
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [docFiles, setDocFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = "";
      if (photoFile) {
        const fd = new FormData(); fd.append("file", photoFile);
        const up = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        photoUrl = up.data.data.url;
      }
      const documents: string[] = [];
      for (const f of docFiles) {
        const fd = new FormData(); fd.append("file", f);
        const up = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        documents.push(up.data.data.url);
      }
      const notes = [form.condition ? `Condition: ${form.condition}` : "", form.notes].filter(Boolean).join("\n");
      await api.post("/assets", { ...form, categoryId: form.categoryId, notes, bookable: form.bookable ? 1 : 0, photoUrl, documents: documents.length > 0 ? documents : undefined });
      showToast("Asset registered", "success");
      onSaved();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed to save";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Register Asset">
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Input label="Asset Name" value={form.name} onChange={set("name")} required />
        <Select label="Category" value={form.categoryId} onChange={set("categoryId")} required options={[{ value: "", label: "Select..." }, ...categories.map((c) => ({ value: String(c.id), label: c.name }))]} />
        <Input label="Serial Number" value={form.serialNumber} onChange={set("serialNumber")} />
        <div className="flex gap-sm">
          <Input label="Model" value={form.model} onChange={set("model")} />
          <Input label="Manufacturer" value={form.manufacturer} onChange={set("manufacturer")} />
        </div>
        <div className="flex gap-sm">
          <Input label="Purchase Date" type="date" value={form.purchaseDate} onChange={set("purchaseDate")} />
          <Input label="Cost" value={form.purchaseCost} onChange={set("purchaseCost")} placeholder="0.00" />
          <Input label="Warranty Expiry" type="date" value={form.warrantyExpiry} onChange={set("warrantyExpiry")} />
        </div>
        <Input label="Location" value={form.location} onChange={set("location")} />
        <div className="flex gap-sm">
          <Input label="Condition" value={form.condition} onChange={set("condition")} placeholder="e.g. Good, Fair, Poor" />
          <div className="field" style={{ justifyContent: "flex-end" }}>
            <label className="field-label">Bookable</label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
              <input type="checkbox" checked={form.bookable} onChange={(e) => setForm((f) => ({ ...f, bookable: e.target.checked }))} /> <span style={{ color: "var(--color-text-muted)" }}>Can be reserved</span>
            </label>
          </div>
        </div>
        <Input label="Description" value={form.description} onChange={set("description")} />
        <Input label="Notes" value={form.notes} onChange={set("notes")} />
        <div className="field">
          <label className="field-label">Photo</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)} />
        </div>
        <div className="field">
          <label className="field-label">Additional Documents</label>
          <input type="file" multiple accept=".pdf,.doc,.docx,.xlsx,.csv" onChange={(e) => setDocFiles(Array.from(e.target.files ?? []))} />
        </div>
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Register</Button>
        </div>
      </form>
    </Modal>
  );
}
