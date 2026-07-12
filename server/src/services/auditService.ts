import { db } from "../config/db";
import { auditCycles } from "../models/auditCycles";
import { auditItems } from "../models/auditItems";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { AppError } from "../utils/AppError";
import { eq, sql, ne, and, inArray } from "drizzle-orm";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

export async function listCycles() {
  return db
    .select({
      id: auditCycles.id,
      title: auditCycles.title,
      description: auditCycles.description,
      plannedStart: auditCycles.plannedStart,
      plannedEnd: auditCycles.plannedEnd,
      status: auditCycles.status,
      startedAt: auditCycles.startedAt,
      completedAt: auditCycles.completedAt,
      conductedBy: auditCycles.conductedBy,
      notes: auditCycles.notes,
      createdAt: auditCycles.createdAt,
      scopeDepartmentId: auditCycles.scopeDepartmentId,
      scopeLocation: auditCycles.scopeLocation,
      auditorIds: auditCycles.auditorIds,
      itemCount: sql<number>`(SELECT count(*) FROM audit_items WHERE audit_items.audit_cycle_id = ${auditCycles.id})`,
    })
    .from(auditCycles)
    .orderBy(auditCycles.createdAt);
}

export async function getCycleById(id: string) {
  const [cycle] = await db
    .select({
      id: auditCycles.id,
      title: auditCycles.title,
      description: auditCycles.description,
      plannedStart: auditCycles.plannedStart,
      plannedEnd: auditCycles.plannedEnd,
      status: auditCycles.status,
      startedAt: auditCycles.startedAt,
      completedAt: auditCycles.completedAt,
      conductedBy: auditCycles.conductedBy,
      notes: auditCycles.notes,
      scopeDepartmentId: auditCycles.scopeDepartmentId,
      scopeLocation: auditCycles.scopeLocation,
      auditorIds: auditCycles.auditorIds,
      createdAt: auditCycles.createdAt,
      updatedAt: auditCycles.updatedAt,
    })
    .from(auditCycles)
    .where(eq(auditCycles.id, id))
    .limit(1);
  if (!cycle) throw new AppError("NOT_FOUND", "Audit cycle not found.", 404);

  const items = await db
    .select({
      id: auditItems.id,
      auditCycleId: auditItems.auditCycleId,
      assetId: auditItems.assetId,
      expectedLocation: auditItems.expectedLocation,
      actualLocation: auditItems.actualLocation,
      verdict: auditItems.verdict,
      discrepancy: auditItems.discrepancy,
      notes: auditItems.notes,
      assetTag: assets.assetTag,
      assetName: assets.name,
      assetStatus: assets.status,
      assetLocation: assets.location,
    })
    .from(auditItems)
    .leftJoin(assets, eq(auditItems.assetId, assets.id))
    .where(eq(auditItems.auditCycleId, id))
    .orderBy(auditItems.createdAt);

  return { ...cycle, items };
}

export async function createCycle(data: { title: string; description?: string; plannedStart?: string; plannedEnd?: string; conductedBy?: string; scopeDepartmentId?: string; scopeLocation?: string; auditorIds?: string[] }) {
  const [cycle] = await db.insert(auditCycles).values(data as never).returning();
  return cycle;
}

export async function populateItems(cycleId: string) {
  const all = await db
    .select({ id: assets.id, location: assets.location })
    .from(assets)
    .where(sql`${assets.status} != 'retired'`);
  if (all.length === 0) return 0;
  await db.insert(auditItems).values(
    all.map((a) => ({ auditCycleId: cycleId, assetId: a.id, expectedLocation: a.location })),
  );
  return all.length;
}

export async function updateCycleStatus(id: string, status: string) {
  const cycle = await getCycleById(id);
  const updates: Record<string, unknown> = { status };
  if (status === "in_progress") updates.startedAt = new Date();
  if (status === "completed") updates.completedAt = new Date();

  if (status === "completed") {
    // Flip confirmed-missing assets to "lost"
    const missing = await db
      .select({ id: auditItems.id, assetId: auditItems.assetId })
      .from(auditItems)
      .where(and(eq(auditItems.auditCycleId, id), eq(auditItems.verdict, "missing")));
    for (const item of missing) {
      await db.update(assets).set({ status: "lost" }).where(eq(assets.id, item.assetId));
    }

    // Notify discrepancies
    const discrepancies = await db
      .select({ assetId: auditItems.assetId, assetTag: assets.assetTag, assetName: assets.name })
      .from(auditItems)
      .leftJoin(assets, eq(auditItems.assetId, assets.id))
      .where(and(eq(auditItems.auditCycleId, id), ne(auditItems.verdict, "found"), sql`${auditItems.verdict} is not null`));

    const admins = await db
      .select({ id: employees.id })
      .from(employees)
      .where(inArray(employees.role, ["admin", "manager"]));
    for (const d of discrepancies) {
      for (const admin of admins) {
        await notificationService.create({
          employeeId: admin.id,
          title: "Audit Discrepancy Flagged",
          message: `Asset ${d.assetTag} (${d.assetName}) flagged during audit.`,
          type: "audit",
        });
      }
    }
  }

  await db.update(auditCycles).set(updates).where(eq(auditCycles.id, id));
  return { ...cycle, ...updates };
}

export async function updateItemVerdict(itemId: string, data: { verdict?: string; actualLocation?: string; discrepancy?: string; notes?: string }) {
  const [item] = await db
    .select({ id: auditItems.id, auditCycleId: auditItems.auditCycleId, status: auditCycles.status })
    .from(auditItems)
    .leftJoin(auditCycles, eq(auditItems.auditCycleId, auditCycles.id))
    .where(eq(auditItems.id, itemId))
    .limit(1);

  if (!item) throw new AppError("NOT_FOUND", "Audit item not found.", 404);
  if (item.status === "completed" || item.status === "cancelled") {
    throw new AppError("CYCLE_LOCKED", "Cannot modify items in a completed or cancelled audit cycle.", 400);
  }

  const [updated] = await db.update(auditItems).set(data as never).where(eq(auditItems.id, itemId)).returning();

  await activityLog.log({
    action: "audit_verdict",
    entityType: "audit_item",
    entityId: itemId,
    details: data as Record<string, unknown>,
  });

  return updated;
}

export async function discrepancyReport(cycleId: string) {
  return db
    .select({
      id: auditItems.id,
      assetId: auditItems.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      expectedLocation: auditItems.expectedLocation,
      actualLocation: auditItems.actualLocation,
      verdict: auditItems.verdict,
      discrepancy: auditItems.discrepancy,
      notes: auditItems.notes,
    })
    .from(auditItems)
    .leftJoin(assets, eq(auditItems.assetId, assets.id))
    .where(and(eq(auditItems.auditCycleId, cycleId), ne(auditItems.verdict, "found"), sql`${auditItems.verdict} is not null`))
    .orderBy(auditItems.createdAt);
}
