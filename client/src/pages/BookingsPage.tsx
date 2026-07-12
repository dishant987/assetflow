import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, Modal, Input, Card, StatusBadge, showToast, PageLoader, EmptyState } from "../components/ui";
import api from "../lib/api";

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

  const events = bookings.map((b) => ({
    title: `${b.assetTag} — ${b.bookerName}${b.purpose ? ` (${b.purpose})` : ""}`,
    start: new Date(b.slotStart),
    end: new Date(b.slotEnd),
    resource: b,
  }));

  const eventStyleGetter = (event: { resource?: Booking }) => {
    const status = event.resource?.status;
    const color = status === "approved" ? "#00A09D" : status === "pending" ? "#F59E0B" : status === "cancelled" ? "#9CA3AF" : "#714B67";
    return { style: { backgroundColor: color, borderRadius: "4px", color: "#fff", border: "none", fontSize: 13 } };
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex" style={{ justifyContent: "flex-end" }}>
        <Button onClick={() => setShowCreate(true)}>+ New Booking</Button>
      </div>

      {loading ? <PageLoader /> : bookings.length === 0 ? <EmptyState title="No bookings yet" description="Create a booking to reserve an asset." /> : <Card style={{ padding: 16 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 500 }}
          onSelectEvent={(e) => setSelectedEvent(e.resource as Booking)}
          eventPropGetter={eventStyleGetter}
          views={["month", "week", "day"]}
          defaultView="week"
        />
      </Card>}

      {showCreate && <CreateBookingModal onClose={() => setShowCreate(false)} onDone={() => { setShowCreate(false); fetchBookings(); }} />}
      {selectedEvent && <BookingDetailModal booking={selectedEvent} onClose={() => setSelectedEvent(null)} onDone={() => { setSelectedEvent(null); fetchBookings(); }} />}
    </div>
  );
}

function CreateBookingModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ assetTag: "", purpose: "", slotStart: "", slotEnd: "" });
  const [saving, setSaving] = useState(false);
  const [overlap, setOverlap] = useState<{ start: string; end: string } | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setOverlap(null);
    try {
      const asset = await api.get(`/assets?search=${form.assetTag}`);
      if (!asset.data.data.length) { showToast("Asset not found", "error"); setSaving(false); return; }
      await api.post("/bookings", { assetId: asset.data.data[0].id, purpose: form.purpose, slotStart: new Date(form.slotStart).toISOString(), slotEnd: new Date(form.slotEnd).toISOString() });
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
        <Input label="Asset Tag" value={form.assetTag} onChange={(e) => setForm({ ...form, assetTag: e.target.value })} required placeholder="e.g. AF-0114" />
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
  const [saving, setSaving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [rsForm, setRsForm] = useState({ slotStart: "", slotEnd: "" });

  const displayStatus = computeDisplayStatus(booking.status, booking.slotStart, booking.slotEnd);

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
            {booking.status === "pending" && <Button onClick={handleApprove} loading={saving}>Approve</Button>}
            {booking.status !== "cancelled" && <Button variant="secondary" onClick={() => { setRescheduling(true); setRsForm({ slotStart: booking.slotStart.slice(0, 16), slotEnd: booking.slotEnd.slice(0, 16) }); }}>Reschedule</Button>}
            {booking.status !== "cancelled" && <Button variant="secondary" onClick={handleCancel} loading={saving}>Cancel Booking</Button>}
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
