import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, Modal, Input, Select, Card, StatusBadge, showToast, PageLoader, EmptyState, Table } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { useAuthStore } from "../stores/useAuthStore";

const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales: { "en-US": enUS } });

type Booking = {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  bookedBy: string;
  bookerName: string;
  purpose: string | null;
  slotStart: string;
  slotEnd: string;
  status: string;
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Booking | null>(null);
  const [view, setView] = useState<"calendar" | "list">("calendar");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (new URLSearchParams(loc.search).get("book") === "true") {
      setShowCreate(true);
      nav(loc.pathname, { replace: true });
    }
  }, [loc.search, nav, loc.pathname]);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try { const { data } = await api.get("/bookings"); setBookings(data.data); } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const events = bookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => ({
      title: `${b.assetTag} — ${b.bookerName}${b.purpose ? ` (${b.purpose})` : ""}`,
      start: new Date(b.slotStart),
      end: new Date(b.slotEnd),
      allDay: false,
      resource: b,
    }));

  const eventStyleGetter = (event: { resource?: Booking }) => {
    const status = event.resource?.status;
    const color = status === "approved" ? "#00A09D" : status === "pending" ? "#F59E0B" : status === "cancelled" ? "#9CA3AF" : "#714B67";
    return { style: { backgroundColor: color, borderRadius: "4px", color: "#fff", border: "none", fontSize: 13 } };
  };

  const filteredBookings = bookings.filter((b) => {
    const term = search.toLowerCase();
    const matchesSearch =
      b.assetTag.toLowerCase().includes(term) ||
      b.assetName.toLowerCase().includes(term) ||
      b.bookerName.toLowerCase().includes(term) ||
      (b.purpose && b.purpose.toLowerCase().includes(term));
      
    const matchesStatus = !statusFilter || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalItems = filteredBookings.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(page, Math.max(1, totalPages));

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedBookings = filteredBookings.slice(startIndex, endIndex);

  const columns: Column<Booking>[] = [
    { key: "assetTag", label: "Asset Tag", sortable: true, render: (b) => <strong>{b.assetTag}</strong> },
    { key: "assetName", label: "Asset Name", sortable: true },
    { key: "bookerName", label: "Booked By", sortable: true },
    { key: "purpose", label: "Purpose" },
    { key: "slotStart", label: "Start Time", render: (b) => new Date(b.slotStart).toLocaleString() },
    { key: "slotEnd", label: "End Time", render: (b) => new Date(b.slotEnd).toLocaleString() },
    { key: "status", label: "Status", render: (b) => {
        const displayStatus = computeDisplayStatus(b.status, b.slotStart, b.slotEnd);
        return <StatusBadge status={displayStatus} />;
      }
    },
    { key: "actions", label: "", render: (b) => <Button size="sm" variant="ghost" onClick={() => setSelectedEvent(b)}>View</Button> },
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-sm" style={{ alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="flex gap-xs" style={{ background: "var(--color-bg, #F3F4F6)", padding: 4, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <Button
            variant={view === "calendar" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("calendar")}
            style={view === "calendar" ? { background: "#fff", color: "var(--color-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", fontWeight: 600 } : { color: "var(--color-text-secondary)" }}
          >
            Calendar View
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setView("list")}
            style={view === "list" ? { background: "#fff", color: "var(--color-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", fontWeight: 600 } : { color: "var(--color-text-secondary)" }}
          >
            List View
          </Button>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: "280px" }}>
          {view === "list" && (
            <>
              <div style={{ width: "200px" }}>
                <Input
                  placeholder="Search bookings..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div style={{ width: "140px" }}>
                <Select
                  options={[
                    { value: "", label: "All Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "approved", label: "Approved" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </>
          )}
          <Button onClick={() => setShowCreate(true)}>+ New Booking</Button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : bookings.length === 0 ? (
        <EmptyState title="No bookings yet" description="Create a booking to reserve an asset." />
      ) : view === "calendar" ? (
        <Card style={{ padding: 16 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            onSelectEvent={(e) => setSelectedEvent(e.resource as Booking)}
            eventPropGetter={eventStyleGetter}
            views={["month", "week", "day"]}
            defaultView="week"
            showMultiDayTimes={true}
          />
        </Card>
      ) : (
        <>
          <Card>
            {displayedBookings.length === 0 ? (
              <EmptyState title="No bookings found" description="Try adjusting your filters or search query." />
            ) : (
              <Table columns={columns} data={displayedBookings as any} />
            )}
          </Card>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 8px" }}>
              <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
                Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} entries
              </span>
              <div className="flex gap-sm" style={{ alignItems: "center" }}>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activePage === 1}
                  onClick={() => setPage(activePage - 1)}
                >
                  Previous
                </Button>
                <span style={{ fontSize: 13, fontWeight: 500, padding: "0 8px" }}>
                  Page {activePage} of {totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={activePage === totalPages}
                  onClick={() => setPage(activePage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {showCreate && <CreateBookingModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); fetchBookings(); }} />}
      {selectedEvent && <BookingDetailModal booking={selectedEvent} onClose={() => setSelectedEvent(null)} onDone={() => { setSelectedEvent(null); fetchBookings(); }} />}
    </div>
  );
}

function CreateBookingModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ assetId: "", purpose: "", slotStart: "", slotEnd: "" });
  const [saving, setSaving] = useState(false);
  const [overlap, setOverlap] = useState<{ start: string; end: string } | null>(null);
  const [assets, setAssets] = useState<{ id: string; name: string; assetTag: string }[]>([]);

  useEffect(() => {
    api.get("/assets").then((r) => setAssets(r.data.data.filter((a: { bookable: number; status: string }) => a.bookable === 1 && a.status === "available"))).catch(() => {});
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setOverlap(null);
    try {
      await api.post("/bookings", { assetId: form.assetId, purpose: form.purpose, slotStart: new Date(form.slotStart).toISOString(), slotEnd: new Date(form.slotEnd).toISOString() });
      showToast("Booking created", "success");
      onDone();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { code: string; message: string; fields?: Record<string, string> } } } };
      if (e?.response?.data?.error?.code === "BOOKING_OVERLAP") {
        setOverlap({ start: e.response.data.error.fields?.conflictingSlotStart ?? "", end: e.response.data.error.fields?.conflictingSlotEnd ?? "" });
        showToast("Time slot conflict", "error");
      } else {
        showToast(e?.response?.data?.error?.message ?? "Booking failed", "error");
      }
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="New Booking">
      <form onSubmit={handleCreate} className="flex flex-col gap-md">
        <Select label="Asset" value={form.assetId} onChange={(e) => setForm({ ...form, assetId: e.target.value })} required placeholder="Select bookable asset..." options={assets.map((a) => ({ value: a.id, label: `${a.name} (${a.assetTag})` }))} />
        <Input label="Purpose" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
        <Input label="Start" type="datetime-local" value={form.slotStart} onChange={(e) => setForm({ ...form, slotStart: e.target.value })} required />
        <Input label="End" type="datetime-local" value={form.slotEnd} onChange={(e) => setForm({ ...form, slotEnd: e.target.value })} required />
        {overlap && (
          <p style={{ color: "var(--color-error)", fontSize: 13 }}>
            Conflict: {new Date(overlap.start).toLocaleString()} — {new Date(overlap.end).toLocaleString()}
          </p>
        )}
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Book</Button>
        </div>
      </form>
    </Modal>
  );
}

function computeDisplayStatus(s: string, start: string, end: string): string {
  if (s === "cancelled") return "cancelled";
  const now = new Date();
  if (s === "approved" && new Date(end) < now) return "completed";
  if (s === "approved" && new Date(start) <= now && now <= new Date(end)) return "in_progress";
  return s;
}

function BookingDetailModal({ booking, onClose, onDone }: { booking: Booking; onClose: () => void; onDone: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [saving, setSaving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rsForm, setRsForm] = useState({ slotStart: "", slotEnd: "" });

  const displayStatus = computeDisplayStatus(booking.status, booking.slotStart, booking.slotEnd);

  const currentUserId = (user as any)?.id ?? (user as any)?.userId;
  const canManage = user?.role === "admin" || user?.role === "manager" || booking.bookedBy === currentUserId;

  const handleCancel = async () => {
    setSaving(true);
    try { await api.post(`/bookings/${booking.id}/cancel`); showToast("Booking cancelled", "success"); onDone(); } catch { showToast("Failed", "error"); } finally { setSaving(false); }
  };

  const handleApprove = async () => {
    setSaving(true);
    try { await api.post(`/bookings/${booking.id}/approve`); showToast("Booking approved", "success"); onDone(); } catch { showToast("Failed", "error"); } finally { setSaving(false); }
  };

  const handleReschedule = async () => {
    setSaving(true);
    try {
      await api.patch(`/bookings/${booking.id}/reschedule`, { slotStart: new Date(rsForm.slotStart).toISOString(), slotEnd: new Date(rsForm.slotEnd).toISOString() });
      showToast("Booking rescheduled", "success");
      setRescheduling(false);
      onDone();
    } catch { showToast("Reschedule failed", "error"); } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Booking #${booking.id}`}>
      {!rescheduling ? (
        <>
          <dl style={{ fontSize: 14, lineHeight: 2 }}>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Asset</dt>
            <dd>{booking.assetTag} — {booking.assetName}</dd>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Booked By</dt>
            <dd>{booking.bookerName}</dd>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Purpose</dt>
            <dd>{booking.purpose || "—"}</dd>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Start</dt>
            <dd>{new Date(booking.slotStart).toLocaleString()}</dd>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>End</dt>
            <dd>{new Date(booking.slotEnd).toLocaleString()}</dd>
            <dt style={{ color: "var(--color-text-muted)", fontSize: 12, textTransform: "uppercase" }}>Status</dt>
            <dd><StatusBadge status={displayStatus} /></dd>
          </dl>
          <div className="modal-footer">
            {booking.status === "pending" && (user?.role === "admin" || user?.role === "manager") && (
              <Button onClick={handleApprove} loading={saving}>Approve</Button>
            )}
            {booking.status !== "cancelled" && canManage && (
              <Button variant="secondary" onClick={() => { setRescheduling(true); setRsForm({ slotStart: booking.slotStart.slice(0, 16), slotEnd: booking.slotEnd.slice(0, 16) }); }}>Reschedule</Button>
            )}
            {booking.status !== "cancelled" && canManage && (
              <Button variant="secondary" onClick={handleCancel} loading={saving}>Cancel Booking</Button>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-md">
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)" }}>Select new time slot</p>
          <Input label="New Start" type="datetime-local" value={rsForm.slotStart} onChange={(e) => setRsForm({ ...rsForm, slotStart: e.target.value })} />
          <Input label="New End" type="datetime-local" value={rsForm.slotEnd} onChange={(e) => setRsForm({ ...rsForm, slotEnd: e.target.value })} />
          <div className="modal-footer" style={{ padding: 0, border: "none" }}>
            <Button variant="secondary" onClick={() => setRescheduling(false)}>Back</Button>
            <Button onClick={handleReschedule} loading={saving}>Confirm Reschedule</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
