import { Card } from "../components/ui";

export default function NotificationsPage() {
  return (
    <Card>
      <div className="card-header">Notifications</div>
      <div className="card-body">
        <p style={{ color: "var(--color-text-muted)" }}>No notifications yet.</p>
      </div>
    </Card>
  );
}
