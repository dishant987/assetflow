import { Link } from "react-router-dom";
import { Button } from "../components/ui";

export default function NotFound() {
  return (
    <div className="page">
      <div className="flex flex-col items-center justify-center" style={{ minHeight: "60vh", gap: 16, textAlign: "center" }}>
        <div style={{ fontSize: 64, fontWeight: 700, color: "var(--color-text-muted)", lineHeight: 1 }}>404</div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Page Not Found</h1>
        <p style={{ color: "var(--color-text-secondary)", maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/"><Button variant="primary">Go to Dashboard</Button></Link>
      </div>
    </div>
  );
}
