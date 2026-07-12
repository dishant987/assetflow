import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Input, showToast } from "../components/ui";
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
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div className="card-header">Reset Password</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input label="New Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required helper="Min 8 characters" />
            <Button type="submit" loading={loading}>Reset Password</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
