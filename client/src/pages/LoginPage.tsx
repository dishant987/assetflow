import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, showToast } from "../components/ui";
import { useAuthStore } from "../stores/useAuthStore";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      showToast("Signed in successfully", "success");
      nav("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p); };

  return (
    <div className="flex items-start justify-center" style={{ minHeight: "100vh", padding: 24, gap: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400, position: "sticky", top: 24 }}>
        <div className="card-header">Sign In</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <Button type="submit" loading={loading}>Sign In</Button>
          </form>
          <div className="flex" style={{ marginTop: 16, gap: 16, fontSize: 13, justifyContent: "center" }}>
            <Link to="/forgot-password" style={{ color: "var(--color-primary)" }}>Forgot password?</Link>
            <Link to="/signup" style={{ color: "var(--color-primary)" }}>Create account</Link>
          </div>
        </div>
      </div>
      <div className="card" style={{ width: "100%", maxWidth: 360 }}>
        <div className="card-header">Quick Login</div>
        <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="ghost" onClick={() => fill("admin@assetflow.com", "admin123")} style={{ justifyContent: "flex-start", textAlign: "left", fontSize: 13, padding: "8px 12px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-error)", display: "inline-block", marginRight: 8 }} />
            Admin — admin@assetflow.com
          </Button>
          <Button variant="ghost" onClick={() => fill("manager@assetflow.com", "manager123")} style={{ justifyContent: "flex-start", textAlign: "left", fontSize: 13, padding: "8px 12px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-warning)", display: "inline-block", marginRight: 8 }} />
            Manager — manager@assetflow.com
          </Button>
          <Button variant="ghost" onClick={() => fill("depthead@assetflow.com", "dept123")} style={{ justifyContent: "flex-start", textAlign: "left", fontSize: 13, padding: "8px 12px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-info)", display: "inline-block", marginRight: 8 }} />
            Dept Head — depthead@assetflow.com
          </Button>
          <Button variant="ghost" onClick={() => fill("employee@assetflow.com", "emp123")} style={{ justifyContent: "flex-start", textAlign: "left", fontSize: 13, padding: "8px 12px" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-success)", display: "inline-block", marginRight: 8 }} />
            Employee — employee@assetflow.com
          </Button>
        </div>
      </div>
    </div>
  );
}
