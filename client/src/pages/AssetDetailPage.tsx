import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, StatusBadge, Badge, Button, showToast, PageLoader } from "../components/ui";
import { QRCodeSVG } from "qrcode.react";
import api from "../lib/api";

type AssetDetail = {
  id: number;
  assetTag: string;
  name: string;
  description: string | null;
  categoryId: number;
  categoryName: string;
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  purchaseDate: string | null;
  purchaseCost: string | null;
  warrantyExpiry: string | null;
  status: string;
  photoUrl: string | null;
  documents: string[];
  qrCodeValue: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type Allocation = {
  id: number;
  employeeId: number;
  employeeName: string;
  allocatedAt: string;
  returnedAt: string | null;
  status: string;
  notes: string | null;
};

type Maintenance = {
  id: number;
  issueDescription: string;
  priority: string;
  status: string;
  createdAt: string;
};

export default function AssetDetailPage() {
  const { id } = useParams();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [maintenance, setMaintenance] = useState<Maintenance[]>([]);
  const [tab, setTab] = useState<"allocations" | "maintenance">("allocations");

  useEffect(() => {
    if (!id) return;
    api.get(`/assets/${id}`).then(({ data }) => setAsset(data.data)).catch(() => showToast("Failed to load asset", "error"));
    api.get(`/assets/${id}/allocations`).then(({ data }) => setAllocations(data.data)).catch(() => {});
    api.get(`/assets/${id}/maintenance`).then(({ data }) => setMaintenance(data.data)).catch(() => {});
  }, [id]);

  if (!asset) return <PageLoader />;

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-lg" style={{ flexWrap: "wrap" }}>
        <Card style={{ flex: "1 1 400px" }}>
          <div className="card-header">
            <span>{asset.assetTag} — {asset.name}</span>
            <StatusBadge status={asset.status} />
          </div>
          <div className="card-body">
            <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                {asset.photoUrl && <img src={asset.photoUrl} alt={asset.name} style={{ maxWidth: 200, borderRadius: "var(--radius-md)" }} />}
                <dl style={{ marginTop: 12, fontSize: 14, lineHeight: 2 }}>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Category</dt>
                  <dd>{asset.categoryName}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Serial Number</dt>
                  <dd>{asset.serialNumber || "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Model</dt>
                  <dd>{asset.model || "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Manufacturer</dt>
                  <dd>{asset.manufacturer || "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Location</dt>
                  <dd>{asset.location || "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Purchase Date</dt>
                  <dd>{asset.purchaseDate || "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Cost</dt>
                  <dd>{asset.purchaseCost ? `$${asset.purchaseCost}` : "—"}</dd>
                  <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Warranty</dt>
                  <dd>{asset.warrantyExpiry || "—"}</dd>
                </dl>
                {asset.notes && <p style={{ marginTop: 12, fontStyle: "italic", color: "var(--color-text-secondary)" }}>{asset.notes}</p>}
              </div>
              <div style={{ textAlign: "center" }}>
                <QRCodeSVG value={asset.qrCodeValue} size={160} level="M" />
                <p style={{ fontSize: 12, color: "var(--color-text-muted)", marginTop: 8 }}>{asset.qrCodeValue}</p>
                <button className="btn btn-ghost btn-sm" onClick={() => { const s = new XMLSerializer().serializeToString(document.querySelector("svg")!); const w = window.open(); w?.document.write(s); w?.print(); }}>
                  🖨️ Print QR
                </button>
              </div>
            </div>
            {asset.documents && asset.documents.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontWeight: 600, marginBottom: 8 }}>Documents</p>
                <div className="flex gap-sm" style={{ flexWrap: "wrap" }}>
                  {asset.documents.map((d, i) => <a key={i} href={d} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">{d.split("/").pop()}</a>)}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <div className="flex gap-sm">
            <Button variant={tab === "allocations" ? "primary" : "ghost"} size="sm" onClick={() => setTab("allocations")}>Allocation History</Button>
            <Button variant={tab === "maintenance" ? "primary" : "ghost"} size="sm" onClick={() => setTab("maintenance")}>Maintenance History</Button>
          </div>
        </div>
        <div className="card-body">
          {tab === "allocations" && (
            <table className="table">
              <thead>
                <tr><th>Employee</th><th>Allocated</th><th>Returned</th><th>Status</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id}>
                    <td>{a.employeeName}</td>
                    <td>{new Date(a.allocatedAt).toLocaleDateString()}</td>
                    <td>{a.returnedAt ? new Date(a.returnedAt).toLocaleDateString() : "—"}</td>
                    <td><StatusBadge status={a.status} /></td>
                    <td>{a.notes || "—"}</td>
                  </tr>
                ))}
                {allocations.length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No allocations</td></tr>}
              </tbody>
            </table>
          )}
          {tab === "maintenance" && (
            <table className="table">
              <thead>
                <tr><th>Issue</th><th>Priority</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {maintenance.map((m) => (
                  <tr key={m.id}>
                    <td>{m.issueDescription}</td>
                    <td><Badge variant={m.priority === "critical" ? "error" : m.priority === "high" ? "warning" : m.priority === "medium" ? "info" : "muted"}>{m.priority}</Badge></td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {maintenance.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>No maintenance records</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
