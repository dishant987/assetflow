import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input, showToast } from "../components/ui";
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
    <div className="flex items-center justify-center" style={{ minHeight: "100vh", padding: 24 }}>
      <div className="card" style={{ width: "100%", maxWidth: 460 }}>
        <div className="card-header">Create Account</div>
        <div className="card-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-md">
            <Input label="Employee Code" value={form.employeeCode} onChange={set("employeeCode")} required />
            <div className="flex gap-sm">
              <Input label="First Name" value={form.firstName} onChange={set("firstName")} required />
              <Input label="Last Name" value={form.lastName} onChange={set("lastName")} required />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={set("email")} required />
            <Input label="Password" type="password" value={form.password} onChange={set("password")} required helper="Min 8 characters" />
            <Input label="Phone" value={form.phone} onChange={set("phone")} />
            <Input label="Designation" value={form.designation} onChange={set("designation")} />
            <Button type="submit" loading={loading}>Sign Up</Button>
          </form>
          <p style={{ marginTop: 16, fontSize: 13, textAlign: "center" }}>
            Already have an account? <Link to="/login" style={{ color: "var(--color-primary)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
