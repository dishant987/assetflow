import { useEffect, useState, useMemo } from "react";
import { Button, Input, Select, Table, Card, Badge, Modal, showToast, PageLoader, EmptyState } from "../components/ui";
import type { Column } from "../components/ui";
import api from "../lib/api";
import { debounce } from "../lib/lodash";

type Department = { id: string; name: string; code: string; description: string | null; headEmployeeId: string | null; headName: string | null; parentId: string | null; parentName: string | null; isActive: number };
type Category = { id: string; name: string; code: string; description: string | null; isActive: number };
type Employee = { id: string; employeeCode: string; firstName: string; lastName: string; email: string; departmentId: string | null; departmentName: string | null; role: string; status: string; phone: string | null; designation: string | null };

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
  const [showEditEmp, setShowEditEmp] = useState<Employee | null>(null);
  const [deleteDept, setDeleteDept] = useState<Department | null>(null);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const updateSearch = useMemo(
    () =>
      debounce((val: string) => {
        setDebouncedSearch(val);
        setPage(1);
      }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    updateSearch(val);
  };

  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  const filteredEmps = employees.filter((e) => {
    const dept = departments.find((d) => d.id === e.departmentId);
    const deptName = dept ? dept.name : "";
    return (
      e.employeeCode.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.firstName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.lastName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      e.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      deptName.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  });

  const totalItems = tab === "departments" ? filteredDepts.length : tab === "categories" ? filteredCats.length : filteredEmps.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const activePage = Math.min(page, Math.max(1, totalPages));

  const startIndex = (activePage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const displayedDepts = filteredDepts.slice(startIndex, endIndex);
  const displayedCats = filteredCats.slice(startIndex, endIndex);
  const displayedEmps = filteredEmps.slice(startIndex, endIndex);

  const fetchDepts = async () => { try { const r = await api.get("/departments"); setDepartments(r.data.data); } catch { showToast("Failed to load departments", "error"); } };
  const fetchCats = async () => { try { const r = await api.get("/asset-categories"); setCategories(r.data.data); } catch { showToast("Failed to load categories", "error"); } };
  const fetchEmps = async () => { try { const r = await api.get("/employees"); setEmployees(r.data.data); } catch { showToast("Failed to load employees", "error"); } };

  useEffect(() => {
    setLoading(true);
    const tasks = [fetchDepts(), fetchEmps()];
    if (tab === "categories") tasks.push(fetchCats());
    Promise.all(tasks).finally(() => setLoading(false));
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
        <Button size="sm" variant="ghost" onClick={() => setDeleteDept(d)}>Delete</Button>
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
        <Button size="sm" variant="ghost" onClick={() => setDeleteCat(c)}>Delete</Button>
      </div>
    )},
  ];

  const empCols: Column<Employee>[] = [
    { key: "employeeCode", label: "Code" },
    { key: "firstName", label: "Name", sortable: true, render: (e) => `${e.firstName} ${e.lastName}` },
    { key: "email", label: "Email" },
    { key: "departmentName", label: "Department", render: (e) => {
      const dept = departments.find((d) => d.id === e.departmentId);
      return dept ? dept.name : "—";
    } },
    { key: "role", label: "Role", render: (e) => <Badge>{e.role}</Badge> },
    { key: "status", label: "Status", render: (e) => e.status === "active" ? <Badge variant="success">Active</Badge> : <Badge variant="muted">Inactive</Badge> },
    { key: "actions", label: "", render: (e) => (
      <div className="flex gap-xs">
        <Button size="sm" variant="ghost" onClick={() => setShowEditEmp(e)}>Edit</Button>
        {e.role !== "admin" && <Button size="sm" variant="ghost" onClick={() => setShowPromote(e)}>Promote</Button>}
        {e.status === "active" ? <Button size="sm" variant="ghost" onClick={async () => { try { await api.patch(`/employees/${e.id}/status`, { status: "inactive" }); showToast("Deactivated", "success"); fetchEmps(); } catch { showToast("Failed", "error"); } }}>Deactivate</Button> : null}
      </div>
    )},
  ];

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>Organization</h2>
      </div>

      <div className="flex gap-sm" style={{ alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
        <div className="flex gap-xs" style={{ background: "var(--color-bg, #F3F4F6)", padding: 4, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <Button
            variant={tab === "departments" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setTab("departments"); setPage(1); setSearchQuery(""); setDebouncedSearch(""); }}
            style={tab === "departments" ? { background: "#fff", color: "var(--color-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", fontWeight: 600 } : { color: "var(--color-text-secondary)" }}
          >
            Departments
          </Button>
          <Button
            variant={tab === "categories" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setTab("categories"); setPage(1); setSearchQuery(""); setDebouncedSearch(""); }}
            style={tab === "categories" ? { background: "#fff", color: "var(--color-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", fontWeight: 600 } : { color: "var(--color-text-secondary)" }}
          >
            Asset Categories
          </Button>
          <Button
            variant={tab === "employees" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => { setTab("employees"); setPage(1); setSearchQuery(""); setDebouncedSearch(""); }}
            style={tab === "employees" ? { background: "#fff", color: "var(--color-primary)", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", fontWeight: 600 } : { color: "var(--color-text-secondary)" }}
          >
            Employee Directory
          </Button>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", minWidth: "280px" }}>
          <div style={{ width: "220px" }}>
            <Input
              placeholder={`Search ${tab}...`}
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {tab === "departments" && <Button onClick={() => { setEditDept(null); setShowDeptModal(true); }}>+ Add Department</Button>}
          {tab === "categories" && <Button onClick={() => { setEditCat(null); setShowCatModal(true); }}>+ Add Category</Button>}
        </div>
      </div>

      <Card>
        {loading ? <PageLoader /> : tab === "departments" ? (
          filteredDepts.length === 0 ? <EmptyState title="No departments" description={debouncedSearch ? "No departments match your search." : "Add a department to get started."} /> : <Table columns={deptCols} data={displayedDepts} />
        ) : tab === "categories" ? (
          filteredCats.length === 0 ? <EmptyState title="No categories" description={debouncedSearch ? "No categories match your search." : "Add an asset category to get started."} /> : <Table columns={catCols} data={displayedCats} />
        ) : (
          filteredEmps.length === 0 ? <EmptyState title="No employees" description={debouncedSearch ? "No employees match your search." : "Employee directory is empty."} /> : <Table columns={empCols} data={displayedEmps} />
        )}
      </Card>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, padding: "0 8px" }}>
          <span style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>
            Showing {Math.min(startIndex + 1, totalItems)} to {Math.min(endIndex, totalItems)} of {totalItems} entries
          </span>
          <div className="flex gap-sm" style={{ alignItems: "center" }}>
            <Button
              variant="secondary"
              size="sm"
              disabled={activePage === 1}
              onClick={() => setPage(activePage - 1)}
            >
              Previous
            </Button>
            <span style={{ fontSize: 13, fontWeight: 500, padding: "0 8px" }}>
              Page {activePage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={activePage === totalPages}
              onClick={() => setPage(activePage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {showDeptModal && <DeptModal edit={editDept} onClose={() => { setShowDeptModal(false); setEditDept(null); }} onDone={() => { setShowDeptModal(false); setEditDept(null); fetchDepts(); }} departments={departments} employees={employees} />}
      {showCatModal && <CatModal edit={editCat} onClose={() => { setShowCatModal(false); setEditCat(null); }} onDone={() => { setShowCatModal(false); setEditCat(null); fetchCats(); }} />}
      {showPromote && <PromoteModal employee={showPromote} onClose={() => setShowPromote(null)} onDone={() => { setShowPromote(null); fetchEmps(); }} />}
      {showEditEmp && <EmpModal employee={showEditEmp} departments={departments} onClose={() => setShowEditEmp(null)} onDone={() => { setShowEditEmp(null); fetchEmps(); }} />}

      {deleteDept && (
        <Modal
          open={!!deleteDept}
          onClose={() => setDeleteDept(null)}
          title="Delete Department"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteDept(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await api.delete(`/departments/${deleteDept.id}`);
                    showToast("Deleted", "success");
                    fetchDepts();
                  } catch {
                    showToast("Failed to delete department", "error");
                  } finally {
                    setDeleteDept(null);
                  }
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
            Are you sure you want to delete the department <strong>{deleteDept.name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      )}

      {deleteCat && (
        <Modal
          open={!!deleteCat}
          onClose={() => setDeleteCat(null)}
          title="Delete Category"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteCat(null)}>Cancel</Button>
              <Button
                variant="danger"
                onClick={async () => {
                  try {
                    await api.delete(`/asset-categories/${deleteCat.id}`);
                    showToast("Deleted", "success");
                    fetchCats();
                  } catch {
                    showToast("Failed to delete category", "error");
                  } finally {
                    setDeleteCat(null);
                  }
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p style={{ color: "var(--color-text-secondary)", fontSize: "14px", lineHeight: "1.5" }}>
            Are you sure you want to delete the category <strong>{deleteCat.name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      )}
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
      const payload = { ...form, isActive: form.isActive ? 1 : 0, parentId: form.parentId || null, headEmployeeId: form.headEmployeeId || null };
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
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--color-bg, #F9FAFB)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", width: "fit-content" }}>
          <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} style={{ cursor: "pointer" }} />
          <label htmlFor="isActive" style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", cursor: "pointer", userSelect: "none" }}>Active Status</label>
        </div>
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

function EmpModal({ employee, departments, onClose, onDone }: { employee: Employee; departments: Department[]; onClose: () => void; onDone: () => void }) {
  const [form, setForm] = useState({
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone ?? "",
    designation: employee.designation ?? "",
    departmentId: employee.departmentId ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/employees/${employee.id}`, { ...form, departmentId: form.departmentId || null });
      showToast("Employee updated", "success");
      onDone();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? "Failed";
      showToast(msg, "error");
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Edit ${employee.firstName} ${employee.lastName}`}>
      <form onSubmit={handleSave} className="flex flex-col gap-md">
        <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
        <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Designation" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
        <Select label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} placeholder="— None —" options={departments.map((d) => ({ value: String(d.id), label: d.name }))} />
        <div className="modal-footer" style={{ padding: 0, border: "none" }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}
