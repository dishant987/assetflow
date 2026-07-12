import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input, showToast } from "../components/ui";
import api from "../lib/api";

export default function SignupPage() {
  const [form, setForm] = useState({ employeeCode: "", firstName: "", lastName: "", email: "", password: "", phone: "", designation: "" });
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/signup", form);
      showToast("Account created. Please sign in.", "success");
      nav("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Something went wrong";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="auth-wrapper" style={{ justifyContent: "center", alignItems: "center", padding: 24, background: "linear-gradient(135deg, #1A0D17 0%, #3D1C34 50%, #714B67 100%)", overflowY: "auto" }}>
      <div className="auth-form-card" style={{ width: "100%", maxWidth: 500, background: "#ffffff", margin: "20px 0" }}>
        
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
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--color-text)", margin: "4px 0" }}>Create Account</h2>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>Join your organization's asset workspace</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          <Input
            label="Employee Code"
            placeholder="e.g. EMP-101"
            value={form.employeeCode}
            onChange={set("employeeCode")}
            required
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 17h6M9 13h6M9 9h1" />
              </svg>
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="First Name"
              placeholder="John"
              value={form.firstName}
              onChange={set("firstName")}
              required
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              value={form.lastName}
              onChange={set("lastName")}
              required
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@company.com"
            value={form.email}
            onChange={set("email")}
            required
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            }
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            required
            helper="Min 8 characters"
            leftIcon={
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Input
              label="Phone Number"
              placeholder="+1234567890"
              value={form.phone}
              onChange={set("phone")}
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              }
            />
            <Input
              label="Designation"
              placeholder="Software Engineer"
              value={form.designation}
              onChange={set("designation")}
              leftIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  <rect width="20" height="14" x="2" y="6" rx="2" />
                </svg>
              }
            />
          </div>

          <button type="submit" className="btn-premium" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 13, textAlign: "center", color: "var(--color-text-secondary)" }}>
          Already have an account? <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600, textDecoration: "none" }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

