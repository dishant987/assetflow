import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input, showToast } from "../components/ui";
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
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div className="card-header">Verify Code</div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16 }}>
            Enter the 6-digit code sent to {email || "your email"}.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input label="6-digit Code" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} />
            <Button type="submit" loading={loading}>Verify Code</Button>
          </form>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <Button variant="ghost" size="sm" onClick={handleResend} disabled={cooldown > 0 || resending}>
              {resending ? "Resending..." : cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
