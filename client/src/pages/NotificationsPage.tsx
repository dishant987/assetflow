import { useEffect, useState, useCallback } from "react";
import { Card, StatusBadge, showToast, Button, PageLoader, EmptyState } from "../components/ui";
import { useNotificationStore } from "../stores/useNotificationStore";
import api from "../lib/api";

export default function NotificationsPage() {
  const { items, loading, setItems, setUnread, setLoading } = useNotificationStore();
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setItems(data.data);
      setUnread(data.data.filter((n: { isRead: boolean }) => !n.isRead).length);
    } catch { showToast("Failed to load notifications", "error"); }
    finally { setLoading(false); }
  }, [setItems, setUnread, setLoading]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const markRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchItems();
    } catch { showToast("Failed", "error"); }
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchItems();
    } catch { showToast("Failed", "error"); }
  };

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(page, Math.max(1, totalPages));

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedItems = items.slice(startIndex, endIndex);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Notifications</h2>
        {items.some((n) => !n.isRead) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>Mark All Read</Button>
        )}
      </div>
      <Card>
        <div className="card-body">
          {loading ? (
            <PageLoader />
          ) : items.length === 0 ? (
            <EmptyState title="No notifications yet" description="Notifications will appear here as events happen." />
          ) : (
            <div className="flex flex-col" style={{ gap: 8 }}>
              {displayedItems.map((n) => (
                <div key={n.id} className="card card-accent" style={{ padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, opacity: n.isRead ? 0.6 : 1 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 14 }}>{n.title}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
                    <StatusBadge status={n.isRead ? "read" : "unread"} />
                    {!n.isRead && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark Read</Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, padding: "0 8px" }}>
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
    </div>
  );
}
