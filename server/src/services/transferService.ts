import { db } from "../config/db";
import { transferRequests } from "../models/transferRequests";
import { allocations } from "../models/allocations";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { departments } from "../models/departments";
import { AppError } from "../utils/AppError";
import { eq, and, or, desc, isNull, sql } from "drizzle-orm";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

export async function list(opts?: { userId?: string; role?: string }) {
  const conditions = [];

  if (opts?.role === "department_head" && opts?.userId) {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    const userDeptId = emp?.departmentId;
    if (userDeptId) {
      conditions.push(
        or(
          eq(transferRequests.fromDepartmentId, userDeptId),
          eq(transferRequests.toDepartmentId, userDeptId)
        )
      );
    } else {
      conditions.push(sql`1 = 0`);
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: transferRequests.id,
      assetId: transferRequests.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      fromEmployeeName: sql`concat(e1.first_name, ' ', e1.last_name)`,
      toEmployeeName: sql`concat(e2.first_name, ' ', e2.last_name)`,
      fromDepartmentName: departments.name,
      status: transferRequests.status,
      requestedAt: transferRequests.requestedAt,
      approvedAt: transferRequests.approvedAt,
      notes: transferRequests.notes,
    })
    .from(transferRequests)
    .leftJoin(assets, eq(transferRequests.assetId, assets.id))
    .leftJoin(sql`employees e1`, sql`e1.id = ${transferRequests.fromEmployeeId}`)
    .leftJoin(sql`employees e2`, sql`e2.id = ${transferRequests.toEmployeeId}`)
    .leftJoin(departments, eq(transferRequests.fromDepartmentId, departments.id))
    .where(where)
    .orderBy(desc(transferRequests.requestedAt));
}

export async function create(data: {
  assetId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  notes?: string;
}) {
  const [fromEmp] = await db
    .select({ departmentId: employees.departmentId })
    .from(employees)
    .where(eq(employees.id, data.fromEmployeeId))
    .limit(1);

  const [toEmp] = await db
    .select({ departmentId: employees.departmentId })
    .from(employees)
    .where(eq(employees.id, data.toEmployeeId))
    .limit(1);

  const [req] = await db
    .insert(transferRequests)
    .values({
      ...data,
      fromDepartmentId: fromEmp?.departmentId ?? null,
      toDepartmentId: toEmp?.departmentId ?? null,
    })
    .returning();

  await db
    .update(allocations)
    .set({ status: "transfer_pending" })
    .where(and(eq(allocations.assetId, data.assetId), eq(allocations.status, "active")));

  await notificationService.create({
    employeeId: data.toEmployeeId,
    title: "Transfer Requested",
    message: "A transfer request has been created for you.",
    type: "transfer",
    link: `/allocations`,
  });

  return req;
}

export async function approve(id: string, approvedBy: string, userRole?: string) {
  const [req] = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, id))
    .limit(1);
  if (!req) throw new AppError("NOT_FOUND", "Transfer request not found.", 404);
  if (req.status !== "pending") throw new AppError("ALREADY_PROCESSED", "This request has already been processed.", 400);

  if (userRole === "department_head") {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, approvedBy))
      .limit(1);
    const userDeptId = emp?.departmentId;

    if (!userDeptId || (req.fromDepartmentId !== userDeptId && req.toDepartmentId !== userDeptId)) {
      throw new AppError(
        "ROLE_NOT_ALLOWED",
        "You don't have permission to approve transfer requests outside your department.",
        403,
      );
    }
  }

  // End current allocation
  await db
    .update(allocations)
    .set({ status: "returned", returnedAt: new Date() })
    .where(and(eq(allocations.assetId, req.assetId), sql`${allocations.status} IN ('active', 'transfer_pending')`));

  // Create new allocation
  await db
    .insert(allocations)
    .values({
      assetId: req.assetId,
      employeeId: req.toEmployeeId!,
      departmentId: req.toDepartmentId ?? null,
    })
    .returning();

  // Approve request
  const [updated] = await db
    .update(transferRequests)
    .set({ status: "approved", approvedAt: new Date(), approvedBy })
    .where(eq(transferRequests.id, id))
    .returning();

  await notificationService.create({
    employeeId: req.toEmployeeId!,
    title: "Transfer Approved",
    message: "Asset transfer has been approved.",
    type: "transfer",
  });

  await activityLog.log({
    employeeId: approvedBy,
    action: "transfer_approved",
    entityType: "transfer",
    entityId: id,
  });

  return updated;
}

export async function reject(id: string, approvedBy: string, userRole?: string) {
  const [req] = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, id))
    .limit(1);
  if (!req) throw new AppError("NOT_FOUND", "Transfer request not found.", 404);
  if (req.status !== "pending") throw new AppError("ALREADY_PROCESSED", "This request has already been processed.", 400);

  if (userRole === "department_head") {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, approvedBy))
      .limit(1);
    const userDeptId = emp?.departmentId;

    if (!userDeptId || (req.fromDepartmentId !== userDeptId && req.toDepartmentId !== userDeptId)) {
      throw new AppError(
        "ROLE_NOT_ALLOWED",
        "You don't have permission to reject transfer requests outside your department.",
        403,
      );
    }
  }

  await db
    .update(allocations)
    .set({ status: "active" })
    .where(and(eq(allocations.assetId, req.assetId), eq(allocations.status, "transfer_pending")));

  const [updated] = await db
    .update(transferRequests)
    .set({ status: "rejected", rejectedAt: new Date(), approvedBy })
    .where(eq(transferRequests.id, id))
    .returning();

  return updated;
}
