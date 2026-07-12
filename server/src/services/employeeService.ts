import { db } from "../config/db";
import { employees } from "../models/employees";
import { AppError } from "../utils/AppError";
import { eq } from "drizzle-orm";

export async function list() {
  const rows = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      role: employees.role,
      status: employees.status,
      departmentId: employees.departmentId,
      phone: employees.phone,
      designation: employees.designation,
      joinedAt: employees.joinedAt,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .orderBy(employees.firstName);
  return rows;
}

export async function getById(id: number) {
  const [e] = await db
    .select({
      id: employees.id,
      employeeCode: employees.employeeCode,
      firstName: employees.firstName,
      lastName: employees.lastName,
      email: employees.email,
      role: employees.role,
      status: employees.status,
      departmentId: employees.departmentId,
      phone: employees.phone,
      designation: employees.designation,
      joinedAt: employees.joinedAt,
      createdAt: employees.createdAt,
    })
    .from(employees)
    .where(eq(employees.id, id))
    .limit(1);
  if (!e) throw new AppError("NOT_FOUND", "Employee not found.", 404);
  return e;
}

export async function promote(id: number, role: "manager" | "admin", currentUserId: number) {
  if (id === currentUserId) {
    throw new AppError(
      "SELF_ROLE_ELEVATION_BLOCKED",
      "You don't have permission to do this. Contact your Asset Manager or Admin.",
      403,
    );
  }

  const emp = await getById(id);
  if (emp.role === role) {
    throw new AppError("ALREADY_HAS_ROLE", `This employee already has the ${role} role.`, 400);
  }
  const [updated] = await db.update(employees).set({ role }).where(eq(employees.id, id)).returning();

  const { password, ...rest } = updated;
  return rest;
}

export async function updateStatus(id: number, status: "active" | "inactive" | "suspended") {
  await getById(id);
  const [updated] = await db.update(employees).set({ status }).where(eq(employees.id, id)).returning();

  const { password, ...rest } = updated;
  return rest;
}
