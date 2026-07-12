import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, showToast } from "../components/ui";
import api from "../lib/api";

export default function VerifyOtpPage() {
  const loc = useLocation();
  const email = (loc.state as { email?: string })?.email ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { showToast("No email found. Start again.", "error"); nav("/forgot-password"); return; }
    setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp });
      nav("/reset-password", { state: { resetToken: data.data.resetToken } });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { email });
      showToast("Code resent", "success");
      setCooldown(30);
    } catch {
      showToast("Failed to resend. Try again.", "error");
    } finally {
      setResending(false);
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
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "4px 0" }}>Verify Code</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "8px 0" }}>
            Enter the 6-digit code sent to <strong style={{ color: "var(--color-text)" }}>{email || "your email"}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="6-Digit Verification Code"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />
          
          <button type="submit" className="btn-premium" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            style={{ fontWeight: 600, color: cooldown > 0 ? "var(--color-text-muted)" : "var(--color-primary)" }}
          >
            {resending ? "Resending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
          </button>
        </div>

      </div>
    </div>
  );
}

