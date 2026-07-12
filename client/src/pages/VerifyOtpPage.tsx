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
    <div className="auth-wrapper">
      <div className="auth-split-layout">
        <div className="auth-hero-section">
          <div className="auth-hero-header">
            <div className="auth-logo-icon" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="auth-logo-text" style={{ color: "#fff" }}>AssetFlow</div>
              <p className="auth-hero-subtitle" style={{ maxWidth: 320, marginTop: 8 }}>
                Secure asset changes with a one-time verification code.
              </p>
            </div>
          </div>

          <div className="auth-hero-body">
            <h1 className="auth-hero-title">Verify your reset code</h1>
            <p className="auth-hero-subtitle" style={{ maxWidth: 420, marginTop: 16 }}>
              Enter the six digit code sent to <strong>{email || "your email address"}</strong> to continue.
            </p>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-inner">
            <div className="auth-form-logo-mobile">
              <div className="auth-logo-icon" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="auth-logo-text">AssetFlow</span>
            </div>

            <div className="auth-form-header">
              <h2 className="auth-form-title">Verify Code</h2>
              <p className="auth-form-subtitle">
                We emailed a 6-digit verification code to <strong>{email || "your email"}</strong>
              </p>
            </div>

            <div className="auth-form-card">
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <Input
                  label="Verification Code"
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

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? "Verifying..." : "Verify Code"}
                </button>
              </form>

              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 12, textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  style={{ width: "100%", borderColor: cooldown > 0 ? "var(--color-border)" : "var(--color-primary)" }}
                >
                  {resending ? "Resending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => nav("/login")}
                  style={{ width: "100%" }}
                >
                  Back to sign in
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

