import { useState } from "react";
import {
  Button, Card, Badge, StatusBadge, Modal, Input, Select, DatePicker, Table,
  Sidebar, Topbar, Breadcrumb, showToast,
} from "../components/ui";
import type { Column } from "../components/ui";

const allStatuses = [
  "available", "allocated", "reserved", "under_maintenance", "lost", "retired",
  "active", "inactive", "suspended",
  "pending", "approved", "rejected", "cancelled", "completed",
  "in_progress", "reported",
  "low", "medium", "high", "critical",
  "planned", "found", "missing", "damaged", "mismatched",
  "employee", "manager", "admin",
];

const sampleData = [
  { id: 1, name: "MacBook Pro 16", status: "available", category: "Laptop" },
  { id: 2, name: "Dell Monitor", status: "allocated", category: "Display" },
  { id: 3, name: "iPhone 15", status: "under_maintenance", category: "Phone" },
];

const columns: Column<typeof sampleData[0]>[] = [
  { key: "name", label: "Asset", sortable: true },
  { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  { key: "category", label: "Category" },
];

export default function DevTheme() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div style={{ padding: 32, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 32, color: "#714B67" }}>🎨 Design System</h1>

      {/* ─── Sidebar + Topbar layout demo ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Layout</h2>
        <div style={{ border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
          <div className="app-layout" style={{ minHeight: 200 }}>
            <Sidebar
              logo="AF"
              items={[
                { label: "Dashboard", icon: "📊", href: "#", active: true },
                { label: "Assets", icon: "💻", href: "#" },
                { label: "Bookings", icon: "📅", href: "#" },
                { label: "Reports", icon: "📈", href: "#" },
              ]}
            />
            <div className="app-main">
              <Topbar title="Dashboard" actions={<Button size="sm">+ New</Button>}>
                <Breadcrumb crumbs={[{ label: "Home", href: "#" }, { label: "Dashboard" }]} />
              </Topbar>
              <div className="app-content">
                <p style={{ color: "var(--color-text-secondary)", padding: 40, textAlign: "center" }}>Content area</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Buttons ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Buttons</h2>
        <div className="dev-row">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="primary" disabled>Disabled</Button>
          <Button variant="primary" loading>Loading</Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* ─── Badges ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Badges</h2>
        <div className="dev-row">
          <Badge variant="default">Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="muted">Muted</Badge>
        </div>
      </section>

      {/* ─── Status Badges ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Status Badges (all enum values)</h2>
        <div className="dev-grid">
          {allStatuses.map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <StatusBadge status={s} />
              <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{s}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Card ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Cards</h2>
        <div className="dev-row" style={{ alignItems: "stretch" }}>
          <Card title="Default Card" style={{ flex: 1 }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Body content</p>
          </Card>
          <Card title="Accent Card" accent actions={<Badge variant="success">Active</Badge>} style={{ flex: 1 }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>With accent left border and actions</p>
          </Card>
        </div>
      </section>

      {/* ─── Modal ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Modal</h2>
        <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Allocate Asset"
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button>Confirm</Button>
            </>
          }
        >
          <p style={{ color: "var(--color-text-secondary)", fontSize: 14 }}>Modal body content goes here.</p>
        </Modal>
      </section>

      {/* ─── Form fields ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Form Fields</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
          <Input label="Asset Name" placeholder="Enter asset name" />
          <Input label="Email" type="email" placeholder="Enter email" error="Enter a valid email address" />
          <Select label="Category" options={[{ value: "laptop", label: "Laptop" }, { value: "monitor", label: "Monitor" }]} placeholder="Select category" />
          <DatePicker label="Purchase Date" />
        </div>
      </section>

      {/* ─── Table ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Table</h2>
        <Card>
          <Table columns={columns} data={sampleData} />
        </Card>
      </section>

      {/* ─── Toast ─── */}
      <section className="dev-section">
        <h2 className="dev-section-title">Toast Notifications</h2>
        <div className="dev-row">
          <Button variant="primary" onClick={() => showToast("Asset allocated successfully", "success")}>Success Toast</Button>
          <Button variant="secondary" onClick={() => showToast("That code is incorrect or has expired", "error")}>Error Toast</Button>
          <Button variant="ghost" onClick={() => showToast("Booking is pending approval", "warning")}>Warning Toast</Button>
          <Button variant="ghost" onClick={() => showToast("Session refreshed", "info")}>Info Toast</Button>
        </div>
      </section>
    </div>
  );
}
