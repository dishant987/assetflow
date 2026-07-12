import { useEffect, useState } from "react";
import { Button, Input, Select, Table, Card, Badge, Modal, showToast, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";

type Department = { id: string; name: string; code: string; description: string | null; headEmployeeId: string | null; headName: string | null; parentId: string | null; parentName: string | null; isActive: number };
type Category = { id: string; name: string; code: string; description: string | null; isActive: number };
type Employee = { id: string; employeeCode: string; firstName: string; lastName: string; email: string; departmentId: string | null; departmentName: string | null; role: string; isActive: number };

export default function OrganizationPage() {
  const [tab, setTab] = useState<"departments" | "categories" | "employees">("departments");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [showPromote, setShowPromote] = useState<Employee | null>(null);

  const fetchDepts = async () => { try { const r = await api.get("/departments"); setDepartments(r.data.data); } catch { showToast("Failed to load departments", "error"); } };
  const fetchCats = async () => { try { const r = await api.get("/asset-categories"); setCategories(r.data.data); } catch { showToast("Failed to load categories", "error"); } };
  const fetchEmps = async () => { try { const r = await api.get("/employees"); setEmployees(r.data.data); } catch { showToast("Failed to load employees", "error"); } };

  useEffect(() => {
    setLoading(true);
    if (tab === "departments") { fetchDepts().finally(() => setLoading(false)); }
    else if (tab === "categories") { fetchCats().finally(() => setLoading(false)); }
    else { fetchEmps().finally(() => setLoading(false)); }
  }, [tab]);

  const deptCols: Column<Department>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "code", label: "Code" },
    { key: "headName", label: "Head", render: (d) => d.headName ?? "—" },
    { key: "parentName", label: "Parent", render: (d) => d.parentName ?? "—" },
    { key: "isActive", label: "Status", render: (d) => d.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge> },
    { key: "actions", label: "", render: (d) => (
      <div className="flex gap-xs">
        <Button size="sm" variant="ghost" onClick={() => { setEditDept(d); setShowDeptModal(true); }}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete department?")) { try { await api.delete(`/departments/${d.id}`); showToast("Deleted", "success"); fetchDepts(); } catch { showToast("Failed", "error"); } } }}>Delete</Button>
      </div>
    )},
  ];

  const catCols: Column<Category>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "code", label: "Code" },
    { key: "description", label: "Description", render: (c) => c.description ?? "—" },
    { key: "isActive", label: "Status", render: (c) => c.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge> },
    { key: "actions", label: "", render: (c) => (
      <div className="flex gap-xs">
        <Button size="sm" variant="ghost" onClick={() => { setEditCat(c); setShowCatModal(true); }}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={async () => { if (confirm("Delete category?")) { try { await api.delete(`/asset-categories/${c.id}`); showToast("Deleted", "success"); fetchCats(); } catch { showToast("Failed", "error"); } } }}>Delete</Button>
      </div>
    )},
  ];

  const empCols: Column<Employee>[] = [
    { key: "employeeCode", label: "Code" },
    { key: "firstName", label: "Name", sortable: true, render: (e) => `${e.firstName} ${e.lastName}` },
    { key: "email", label: "Email" },
    { key: "departmentName", label: "Department", render: (e) => e.departmentName ?? "—" },
    { key: "role", label: "Role", render: (e) => <Badge>{e.role}</Badge> },
    { key: "isActive", label: "Status", render: (e) => e.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge> },
    { key: "actions", label: "", render: (e) => (
      <div className="flex gap-xs">
        {e.role !== "admin" && <Button size="sm" variant="ghost" onClick={() => setShowPromote(e)}>Promote</Button>}
        {e.isActive ? <Button size="sm" variant="ghost" onClick={async () => { try { await api.patch(`/employees/${e.id}/status`, { status: "inactive" }); showToast("Deactivated", "success"); fetchEmps(); } catch { showToast("Failed", "error"); } }}>Deactivate</Button> : null}
      </div>
    )},
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex gap-sm" style={{ alignItems: "center" }}>
        <Button variant={tab === "departments" ? "primary" : "ghost"} size="sm" onClick={() => setTab("departments")}>Departments</Button>
        <Button variant={tab === "categories" ? "primary" : "ghost"} size="sm" onClick={() => setTab("categories")}>Asset Categories</Button>
        <Button variant={tab === "employees" ? "primary" : "ghost"} size="sm" onClick={() => setTab("employees")}>Employee Directory</Button>
        <div style={{ flex: 1 }} />
        {tab === "departments" && <Button onClick={() => { setEditDept(null); setShowDeptModal(true); }}>+ Add Department</Button>}
        {tab === "categories" && <Button onClick={() => { setEditCat(null); setShowCatModal(true); }}>+ Add Category</Button>}
      </div>

      <Card>
        {loading ? <PageLoader /> : tab === "departments" ? (
          departments.length === 0 ? <EmptyState title="No departments" description="Add a department to get started." /> : <Table columns={deptCols} data={departments} />
        ) : tab === "categories" ? (
          categories.length === 0 ? <EmptyState title="No categories" description="Add an asset category to get started." /> : <Table columns={catCols} data={categories} />
        ) : (
          employees.length === 0 ? <EmptyState title="No employees" description="Employee directory is empty." /> : <Table columns={empCols} data={employees} />
        )}
      </Card>

      {showDeptModal && <DeptModal edit={editDept} onClose={() => { setShowDeptModal(false); setEditDept(null); }} onDone={() => { setShowDeptModal(false); setEditDept(null); fetchDepts(); }} departments={departments} employees={employees} />}
      {showCatModal && <CatModal edit={editCat} onClose={() => { setShowCatModal(false); setEditCat(null); }} onDone={() => { setShowCatModal(false); setEditCat(null); fetchCats(); }} />}
      {showPromote && <PromoteModal employee={showPromote} onClose={() => setShowPromote(null)} onDone={() => { setShowPromote(null); fetchEmps(); }} />}
    </div>
  );
}

function DeptModal({ edit, onClose, onDone, departments, employees }: { edit: Department | null; onClose: () => void; onDone: () => void; departments: Department[]; employees: Employee[] }) {
  const [form, setForm] = useState({ name: edit?.name ?? "", code: edit?.code ?? "", description: edit?.description ?? "", headEmployeeId: edit?.headEmployeeId ?? "", parentId: edit?.parentId ?? "", isActive: edit ? Boolean(edit.isActive) : true });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, isActive: form.isActive ? 1 : 0 };
      if (edit) { await api.patch(`/departments/${edit.id}`, payload); showToast("Department updated", "success"); }
      else { await api.post("/departments", payload); showToast("Department created", "success"); }
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={edit ? "Edit Department" : "Add Department"}>
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select label="Head" value={form.headEmployeeId} onChange={(e) => setForm({ ...form, headEmployeeId: e.target.value })} placeholder="— Select —" options={employees.map((e) => ({ value: String(e.id), label: `${e.firstName} ${e.lastName}` }))} />
        <Select label="Parent Department" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} placeholder="— None —" options={departments.filter((d) => d.id !== edit?.id).map((d) => ({ value: String(d.id), label: d.name }))} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
        </label>
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{edit ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CatModal({ edit, onClose, onDone }: { edit: Category | null; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({ name: edit?.name ?? "", code: edit?.code ?? "", description: edit?.description ?? "" });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (edit) { await api.patch(`/asset-categories/${edit.id}`, form); showToast("Category updated", "success"); }
      else { await api.post("/asset-categories", form); showToast("Category created", "success"); }
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={edit ? "Edit Category" : "Add Category"}>
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>{edit ? "Update" : "Create"}</Button>
        </div>
      </form>
    </Modal>
  );
}

function PromoteModal({ employee, onClose, onDone }: { employee: Employee; onClose: () => void; onDone: () => void }) {
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post(`/employees/${employee.id}/promote`, { role });
      showToast(`${employee.firstName} ${employee.lastName} promoted to ${role}`, "success");
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Promote ${employee.firstName} ${employee.lastName}`}>
      <form onSubmit={handlePromote} className="flex flex-col gap-md">
        <Select label="New Role" value={role} onChange={(e) => setRole(e.target.value)} required placeholder="— Select —" options={[
          { value: "manager", label: "Manager" },
          { value: "department_head", label: "Department Head" },
        ]} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Promote</Button>
        </div>
      </form>
    </Modal>
  );
}
