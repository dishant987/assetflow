import { db } from "../config/db";
import { allocations } from "../models/allocations";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { departments } from "../models/departments";
import { AppError } from "../utils/AppError";
import { eq, and, isNull, sql } from "drizzle-orm";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

export async function list() {
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
    .orderBy(allocations.allocatedAt);
}

export async function getById(id: number) {
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

export async function create(data: { assetId: number; employeeId: number; departmentId?: number; notes?: string }) {
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

  const [alloc] = await db.insert(allocations).values(data).returning();

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

export async function returnAsset(id: number, notes?: string) {
  const alloc = await getById(id);
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

export async function getActiveForAsset(assetId: number) {
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
