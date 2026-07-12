import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, showToast } from "../components/ui";
import api from "../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      showToast("If an account exists, we've sent a code.", "success");
      nav("/verify-otp", { state: { email } });
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
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "4px 0" }}>Forgot Password</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Enter your email and we'll send you a reset code</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />
          
          <button type="submit" className="btn-premium" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, textAlign: "center", color: "var(--color-text-secondary)" }}>
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Back to sign in</Link>
        </p>

      </div>
    </div>
  );
}

