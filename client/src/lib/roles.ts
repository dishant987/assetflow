export function normalizeRole(role?: string | null) {
  if (role === "asset_manager") return "manager";
  return role ?? "employee";
}

export function hasAnyRole(role?: string | null, ...allowed: Array<string | undefined>) {
  const normalizedRole = normalizeRole(role);
  return allowed.some((candidate) => normalizeRole(candidate) === normalizedRole);
}

export function isAssetManager(role?: string | null) {
  return hasAnyRole(role, "admin", "manager");
}

export function isDepartmentHead(role?: string | null) {
  return normalizeRole(role) === "department_head";
}
