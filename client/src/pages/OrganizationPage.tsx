import { Card } from "../components/ui";

export default function OrganizationPage() {
  return (
    <div className="flex flex-col gap-lg">
      <Card><div className="card-header">Departments</div><div className="card-body"><p style={{ color: "var(--color-text-muted)" }}>Department management coming soon.</p></div></Card>
      <Card><div className="card-header">Asset Categories</div><div className="card-body"><p style={{ color: "var(--color-text-muted)" }}>Category management coming soon.</p></div></Card>
      <Card><div className="card-header">Employees</div><div className="card-body"><p style={{ color: "var(--color-text-muted)" }}>Employee management coming soon.</p></div></Card>
    </div>
  );
}
