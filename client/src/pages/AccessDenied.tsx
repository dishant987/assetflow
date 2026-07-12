import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh", gap: 16, textAlign: "center" }}>
      <div style={{ fontSize: 48, color: "var(--color-text-muted)" }}>🔒</div>
      <h1 style={{ fontSize: 24, fontWeight: 700 }}>Access Denied</h1>
      <p style={{ color: "var(--color-text-secondary)", maxWidth: 400 }}>
        You don't have permission to access this page. Contact your admin if you need access.
      </p>
      <Link to="/"><Button variant="primary">Go to Dashboard</Button></Link>
    </div>
  );
}
