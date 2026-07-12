import { db } from "../config/db";
import { auditCycles } from "../models/auditCycles";
import { auditItems } from "../models/auditItems";
import { assets } from "../models/assets";
import { assetCategories } from "../models/assetCategories";
import { AppError } from "../utils/AppError";
import { eq, sql } from "drizzle-orm";

export async function listCycles() {
  return db
    .select({
      id: auditCycles.id,
      title: auditCycles.title,
      description: auditCycles.description,
      status: auditCycles.status,
      startedAt: auditCycles.startedAt,
      completedAt: auditCycles.completedAt,
      conductedBy: auditCycles.conductedBy,
      notes: auditCycles.notes,
      createdAt: auditCycles.createdAt,
      itemCount: sql<number>`(SELECT count(*) FROM audit_items WHERE audit_items.audit_cycle_id = ${auditCycles.id})`,
    })
    .from(auditCycles)
    .orderBy(auditCycles.createdAt);
}

export async function getCycleById(id: number) {
  const [cycle] = await db
    .select({
      id: auditCycles.id,
      title: auditCycles.title,
      description: auditCycles.description,
      status: auditCycles.status,
      startedAt: auditCycles.startedAt,
      completedAt: auditCycles.completedAt,
      conductedBy: auditCycles.conductedBy,
      notes: auditCycles.notes,
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

export async function createCycle(data: { title: string; description?: string; conductedBy?: number }) {
  const [cycle] = await db.insert(auditCycles).values(data).returning();
  return cycle;
}

export async function populateItems(cycleId: number) {
  const all = await db
    .select({ id: assets.id, location: assets.location })
    .from(assets)
    .where(sql`${assets.status} != 'retired'`);
  // ponytail: batch insert all assets into the cycle
  if (all.length === 0) return 0;
  await db.insert(auditItems).values(
    all.map((a) => ({ auditCycleId: cycleId, assetId: a.id, expectedLocation: a.location })),
  );
  return all.length;
}

export async function updateCycleStatus(id: number, status: string) {
  const cycle = await getCycleById(id);
  const updates: Record<string, unknown> = { status };
  if (status === "in_progress") updates.startedAt = new Date().toISOString();
  if (status === "completed") updates.completedAt = new Date().toISOString();
  await db.update(auditCycles).set(updates).where(eq(auditCycles.id, id));
  return { ...cycle, ...updates };
}

export async function updateItemVerdict(itemId: number, data: { verdict?: string; actualLocation?: string; discrepancy?: string; notes?: string }) {
  const [item] = await db.update(auditItems).set(data as never).where(eq(auditItems.id, itemId)).returning();
  if (!item) throw new AppError("NOT_FOUND", "Audit item not found.", 404);
  return item;
}
