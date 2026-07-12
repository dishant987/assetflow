import { db } from "../config/db";
import { allocations } from "../models/allocations";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { departments } from "../models/departments";
import { AppError } from "../utils/AppError";
import { eq, and, desc, isNull, sql } from "drizzle-orm";
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
      conditions.push(eq(allocations.departmentId, userDeptId));
    } else {
      conditions.push(sql`1 = 0`);
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: allocations.id,
      assetId: allocations.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      employeeId: allocations.employeeId,
      employeeName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      departmentId: allocations.departmentId,
      departmentName: departments.name,
      allocatedAt: allocations.allocatedAt,
      returnedAt: allocations.returnedAt,
      status: allocations.status,
      notes: allocations.notes,
    })
    .from(allocations)
    .leftJoin(assets, eq(allocations.assetId, assets.id))
    .leftJoin(employees, eq(allocations.employeeId, employees.id))
    .leftJoin(departments, eq(allocations.departmentId, departments.id))
    .where(where)
    .orderBy(desc(allocations.allocatedAt));
}

async function checkAllocationAccess(allocationId: string, opts?: { role?: string; userId?: string }) {
  if (opts?.role === "department_head" && opts?.userId) {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    const userDeptId = emp?.departmentId;
    if (!userDeptId) {
      throw new AppError("FORBIDDEN", "You do not belong to any department.", 403);
    }

    const [alloc] = await db
      .select({ departmentId: allocations.departmentId })
      .from(allocations)
      .where(eq(allocations.id, allocationId))
      .limit(1);
    if (!alloc) {
      throw new AppError("NOT_FOUND", "Allocation not found.", 404);
    }
    if (alloc.departmentId !== userDeptId) {
      throw new AppError("FORBIDDEN", "You do not have access to allocations outside your department.", 403);
    }
  }
}

export async function getById(id: string, opts?: { role?: string; userId?: string }) {
  await checkAllocationAccess(id, opts);
  const [row] = await db
    .select({
      id: allocations.id,
      assetId: allocations.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      employeeId: allocations.employeeId,
      employeeName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      departmentId: allocations.departmentId,
      departmentName: departments.name,
      allocatedAt: allocations.allocatedAt,
      returnedAt: allocations.returnedAt,
      status: allocations.status,
      notes: allocations.notes,
    })
    .from(allocations)
    .leftJoin(assets, eq(allocations.assetId, assets.id))
    .leftJoin(employees, eq(allocations.employeeId, employees.id))
    .leftJoin(departments, eq(allocations.departmentId, departments.id))
    .where(eq(allocations.id, id))
    .limit(1);

  if (!row) throw new AppError("NOT_FOUND", "Allocation not found.", 404);
  return row;
}

export async function create(
  data: { assetId: string; employeeId: string; departmentId?: string; notes?: string; expectedReturnAt?: string },
  opts?: { role?: string; userId?: string }
) {
  if (opts?.role === "department_head" && opts?.userId) {
    const [headEmp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    const userDeptId = headEmp?.departmentId;
    if (!userDeptId) {
      throw new AppError("FORBIDDEN", "You do not belong to any department.", 403);
    }

    // Force departmentId to be the department head's department
    data.departmentId = userDeptId;

    // Check if employee is in the same department
    const [targetEmp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, data.employeeId))
      .limit(1);
    if (!targetEmp || targetEmp.departmentId !== userDeptId) {
      throw new AppError("FORBIDDEN", "You can only allocate assets to employees in your department.", 403);
    }
  }

  // Check asset exists and is available
  const [asset] = await db.select().from(assets).where(eq(assets.id, data.assetId)).limit(1);
  if (!asset) throw new AppError("NOT_FOUND", "Asset not found.", 404);

  // Check if already actively allocated
  const [active] = await db
    .select({
      id: allocations.id,
      employeeId: allocations.employeeId,
      employeeName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
    })
    .from(allocations)
    .leftJoin(employees, eq(allocations.employeeId, employees.id))
    .where(and(eq(allocations.assetId, data.assetId), eq(allocations.status, "active")))
    .limit(1);

  if (active) {
    throw new AppError(
      "ASSET_ALREADY_ALLOCATED",
      `This asset is currently held by ${active.employeeName}. Request a transfer instead.`,
      409,
      { allocationId: String(active.id) },
    );
  }

  const [alloc] = await db.insert(allocations).values({ ...data, expectedReturnAt: data.expectedReturnAt ? new Date(data.expectedReturnAt) : undefined }).returning();

  // Update asset status
  await db.update(assets).set({ status: "allocated" }).where(eq(assets.id, data.assetId));

  await notificationService.create({
    employeeId: data.employeeId,
    title: "Asset Allocated",
    message: `Asset ${asset.assetTag} (${asset.name}) has been allocated to you.`,
    type: "allocation",
    link: `/allocations/${alloc.id}`,
  });

  await activityLog.log({
    employeeId: data.employeeId,
    action: "allocated",
    entityType: "allocation",
    entityId: alloc.id,
    details: { assetId: data.assetId, assetTag: asset.assetTag },
  });

  return alloc;
}

export async function returnAsset(id: string, notes?: string, opts?: { role?: string; userId?: string }) {
  await checkAllocationAccess(id, opts);
  const alloc = await getById(id, opts);
  if (alloc.status !== "active") throw new AppError("ALREADY_RETURNED", "This allocation has already been returned.", 400);

  const [updated] = await db
    .update(allocations)
    .set({ status: "returned", returnedAt: new Date(), notes: notes ?? null })
    .where(eq(allocations.id, id))
    .returning();

  // Set asset back to available
  await db.update(assets).set({ status: "available" }).where(eq(assets.id, alloc.assetId));

  return updated;
}

export async function getActiveForAsset(assetId: string) {
  const [row] = await db
    .select({
      id: allocations.id,
      employeeId: allocations.employeeId,
      employeeName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
    })
    .from(allocations)
    .leftJoin(employees, eq(allocations.employeeId, employees.id))
    .where(and(eq(allocations.assetId, assetId), eq(allocations.status, "active")))
    .limit(1);

  return row ?? null;
}
