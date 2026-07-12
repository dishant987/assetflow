import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, showToast } from "../components/ui";
import api from "../lib/api";

export default function ResetPasswordPage() {
  const loc = useLocation();
  const resetToken = (loc.state as { resetToken?: string })?.resetToken ?? "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    if (!resetToken) { showToast("Invalid reset session. Start again.", "error"); nav("/forgot-password", { replace: true }); }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) return;
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { resetToken, newPassword: password });
      showToast("Password updated. Please sign in.", "success");
      nav("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper" style={{ justifyContent: "center", alignItems: "center", padding: 24, background: "linear-gradient(135deg, #1A0D17 0%, #3D1C34 50%, #714B67 100%)" }}>
      <div className="auth-form-card" style={{ width: "100%", maxWidth: 420, background: "#ffffff" }}>
        
        {/* Brand Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          <div className="auth-logo-icon" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="auth-logo-text" style={{ background: "linear-gradient(135deg, var(--color-primary) 60%, var(--color-secondary) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontWeight: 800 }}>AssetFlow</span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "4px 0" }}>Reset Password</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Choose a secure new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            helper="Min 8 characters"
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />
          
          <button type="submit" className="btn-premium" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

      </div>
    </div>
  );
}

