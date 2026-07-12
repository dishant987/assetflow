import { db } from "../config/db";
import { transferRequests } from "../models/transferRequests";
import { allocations } from "../models/allocations";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { departments } from "../models/departments";
import { notifications } from "../models/notifications";
import { AppError } from "../utils/AppError";
import { eq, and, isNull, sql } from "drizzle-orm";

export async function list() {
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
    .leftJoin(employees as never, sql`e1.id = ${transferRequests.fromEmployeeId}`)
    .leftJoin(sql`employees e2`, sql`e2.id = ${transferRequests.toEmployeeId}`)
    .leftJoin(departments, eq(transferRequests.fromDepartmentId, departments.id))
    .orderBy(transferRequests.requestedAt);
}

export async function create(data: {
  assetId: number;
  fromEmployeeId: number;
  toEmployeeId: number;
  notes?: string;
}) {
  const [req] = await db.insert(transferRequests).values(data).returning();
  return req;
}

export async function approve(id: number, approvedBy: number) {
  const [req] = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, id))
    .limit(1);
  if (!req) throw new AppError("NOT_FOUND", "Transfer request not found.", 404);
  if (req.status !== "pending") throw new AppError("ALREADY_PROCESSED", "This request has already been processed.", 400);

  // End current allocation
  await db
    .update(allocations)
    .set({ status: "returned", returnedAt: new Date() })
    .where(and(eq(allocations.assetId, req.assetId), eq(allocations.status, "active")));

  // Create new allocation
  await db
    .insert(allocations)
    .values({ assetId: req.assetId, employeeId: req.toEmployeeId! })
    .returning();

  // Approve request
  const [updated] = await db
    .update(transferRequests)
    .set({ status: "approved", approvedAt: new Date(), approvedBy })
    .where(eq(transferRequests.id, id))
    .returning();

  await db.insert(notifications).values({
    employeeId: req.toEmployeeId!,
    title: "Transfer Approved",
    message: "Asset transfer has been approved.",
    type: "transfer",
  });

  return updated;
}

export async function reject(id: number, approvedBy: number) {
  const [req] = await db
    .select()
    .from(transferRequests)
    .where(eq(transferRequests.id, id))
    .limit(1);
  if (!req) throw new AppError("NOT_FOUND", "Transfer request not found.", 404);
  if (req.status !== "pending") throw new AppError("ALREADY_PROCESSED", "This request has already been processed.", 400);

  const [updated] = await db
    .update(transferRequests)
    .set({ status: "rejected", rejectedAt: new Date(), approvedBy })
    .where(eq(transferRequests.id, id))
    .returning();

  return updated;
}
