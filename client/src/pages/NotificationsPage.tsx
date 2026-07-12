import { useEffect, useCallback } from "react";
import { Card, StatusBadge, showToast, Button, PageLoader, EmptyState } from "../components/ui";
import { useNotificationStore } from "../stores/useNotificationStore";
import api from "../lib/api";

export default function NotificationsPage() {
  const { items, loading, setItems, setUnread, setLoading } = useNotificationStore();

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

  const markRead = async (id: number) => {
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
              {items.map((n) => (
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
    </div>
  );
}
