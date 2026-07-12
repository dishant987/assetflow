import { useAuthStore } from "../stores/useAuthStore";
import { Card } from "../components/ui";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex flex-col gap-lg">
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>Welcome, {user?.firstName}</h2>
      <div className="flex gap-md" style={{ flexWrap: "wrap" }}>
        {[{ label: "Total Assets", value: "—" }, { label: "Allocated", value: "—" }, { label: "Available", value: "—" }, { label: "Under Maintenance", value: "—" }].map((s) => (
          <Card key={s.label} style={{ flex: "1 1 180px", padding: 20 }}>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{s.value}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
