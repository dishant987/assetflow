import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, showToast } from "../components/ui";
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
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div className="card-header">Forgot Password</div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: "var(--color-text-secondary)", marginBottom: 16 }}>
            Enter your email and we'll send you a reset code.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Button type="submit" loading={loading}>Send Reset Code</Button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
            <Link to="/login" style={{ color: "var(--color-primary)" }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
