import { useState, useRef } from "react";
import { Card, Button, Input, showToast } from "../components/ui";
import { useAuthStore } from "../stores/useAuthStore";
import api from "../lib/api";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    phone: user?.phone ?? "",
    designation: user?.designation ?? "",
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPw, setSavingPw] = useState(false);

  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch("/auth/profile", form);
      setUser(data.data);
      showToast("Profile updated", "success");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Update failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      showToast("Passwords do not match", "error");
      return;
    }
    setSavingPw(true);
    try {
      await api.patch("/auth/profile/password", { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      showToast("Password changed. Please sign in again.", "success");
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSavingPw(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const { data: updated } = await api.patch("/auth/profile", { avatarUrl: data.data.url });
      setUser(updated.data);
      showToast("Avatar updated", "success");
    } catch {
      showToast("Upload failed", "error");
    } finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  return (
    <div className="flex flex-col gap-lg">
      <h2 style={{ fontSize: 20, fontWeight: 700 }}>My Profile</h2>

      {/* Avatar */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{ width: 80, height: 80, borderRadius: "50%", background: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ color: "#fff", fontSize: 28, fontWeight: 700 }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            )}
          </div>
          <div>
            <p style={{ fontWeight: 600 }}>{user?.firstName} {user?.lastName}</p>
            <p style={{ fontSize: 13, color: "var(--color-text-muted)" }}>{user?.email}</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
            <Button variant="ghost" size="sm" style={{ marginTop: 8 }} onClick={() => fileRef.current?.click()} loading={uploading}>
              {user?.avatarUrl ? "Change Photo" : "Upload Photo"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Details + Password side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card title="Personal Information">
          <form onSubmit={handleSaveDetails} className="flex flex-col gap-md">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
              <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
            </div>
            <Input label="Email" value={user?.email ?? ""} disabled helper="Email cannot be changed" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            </div>
            <div>
              <Button type="submit" loading={saving}>Save Changes</Button>
            </div>
          </form>
        </Card>

        <Card title="Change Password">
          <form onSubmit={handleChangePassword} className="flex flex-col gap-md">
            <Input label="Current Password" type="password" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            <Input label="New Password" type="password" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required minLength={8} />
            <Input label="Confirm New Password" type="password" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} required minLength={8} />
            <div>
              <Button type="submit" loading={savingPw}>Change Password</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
