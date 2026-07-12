import { db } from "../config/db";
import { auditCycles } from "../models/auditCycles";
import { auditItems } from "../models/auditItems";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { allocations } from "../models/allocations";
import { AppError } from "../utils/AppError";
import { eq, sql, ne, and, inArray, or } from "drizzle-orm";
import { departments } from "../models/departments";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

async function checkCycleAccess(cycleId: string, opts?: { role: string; userId: string }) {
  if (opts?.role === "department_head" && opts?.userId) {
    const [cycle] = await db
      .select({
        scopeDepartmentId: auditCycles.scopeDepartmentId,
        conductedBy: auditCycles.conductedBy,
        auditorIds: auditCycles.auditorIds,
      })
      .from(auditCycles)
      .where(eq(auditCycles.id, cycleId))
      .limit(1);
    if (!cycle) throw new AppError("NOT_FOUND", "Audit cycle not found.", 404);

    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    const departmentId = emp?.departmentId || null;

    const isAuthorized =
      (cycle.scopeDepartmentId === departmentId && departmentId !== null) ||
      cycle.conductedBy === opts.userId ||
      (cycle.auditorIds && (cycle.auditorIds as string[]).includes(opts.userId));

    if (!isAuthorized) {
      throw new AppError("FORBIDDEN", "You do not have access to this audit cycle.", 403);
    }
  }
}

export async function listCycles(opts?: { role: string; userId: string }) {
  let departmentId: string | null = null;
  if (opts?.role === "department_head" && opts?.userId) {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    departmentId = emp?.departmentId || null;
  }

  let query = db
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
    .$dynamic();

  if (opts?.role === "department_head" && opts?.userId) {
    query = query.where(
      or(
        departmentId ? eq(auditCycles.scopeDepartmentId, departmentId) : sql`false`,
        eq(auditCycles.conductedBy, opts.userId),
        sql`${auditCycles.auditorIds}::jsonb @> ${JSON.stringify([opts.userId])}::jsonb`
      )
    );
  }

  return query.orderBy(auditCycles.createdAt);
}

export async function getCycleById(id: string, opts?: { role: string; userId: string }) {
  await checkCycleAccess(id, opts);

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

export async function createCycle(data: {
  title: string;
  description?: string;
  plannedStart?: string;
  plannedEnd?: string;
  conductedBy?: string;
  scopeDepartmentId?: string;
  scopeLocation?: string;
  auditorIds?: string[];
}) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  let scopeDeptId = data.scopeDepartmentId;
  if (scopeDeptId && !uuidRegex.test(scopeDeptId)) {
    const [dept] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(or(
        eq(sql`lower(${departments.name})`, scopeDeptId.toLowerCase()),
        eq(sql`lower(${departments.code})`, scopeDeptId.toLowerCase())
      ))
      .limit(1);
    scopeDeptId = dept?.id || null;
  }

  let condBy = data.conductedBy;
  if (condBy && !uuidRegex.test(condBy)) {
    if (condBy.includes("@")) {
      const [emp] = await db.select({ id: employees.id }).from(employees).where(eq(sql`lower(${employees.email})`, condBy.toLowerCase())).limit(1);
      condBy = emp?.id || null;
    } else {
      const parts = condBy.split(" ").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) {
        const firstName = parts[0];
        const lastName = parts.slice(1).join(" ") || "";
        const [emp] = await db
          .select({ id: employees.id })
          .from(employees)
          .where(and(
            eq(sql`lower(${employees.firstName})`, firstName.toLowerCase()),
            lastName ? eq(sql`lower(${employees.lastName})`, lastName.toLowerCase()) : sql`true`
          ))
          .limit(1);
        condBy = emp?.id || null;
      }
    }
  }

  let resolvedAuditors: string[] = [];
  if (data.auditorIds && data.auditorIds.length > 0) {
    for (const a of data.auditorIds) {
      if (uuidRegex.test(a)) {
        resolvedAuditors.push(a);
      } else if (a.includes("@")) {
        const [emp] = await db.select({ id: employees.id }).from(employees).where(eq(sql`lower(${employees.email})`, a.toLowerCase())).limit(1);
        if (emp) resolvedAuditors.push(emp.id);
      } else {
        const parts = a.split(" ").map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) {
          const firstName = parts[0];
          const lastName = parts.slice(1).join(" ") || "";
          const [emp] = await db
            .select({ id: employees.id })
            .from(employees)
            .where(and(
              eq(sql`lower(${employees.firstName})`, firstName.toLowerCase()),
              lastName ? eq(sql`lower(${employees.lastName})`, lastName.toLowerCase()) : sql`true`
            ))
            .limit(1);
          if (emp) resolvedAuditors.push(emp.id);
        }
      }
    }
  }

  const [cycle] = await db
    .insert(auditCycles)
    .values({
      title: data.title,
      description: data.description ?? null,
      plannedStart: data.plannedStart ? new Date(data.plannedStart) : null,
      plannedEnd: data.plannedEnd ? new Date(data.plannedEnd) : null,
      conductedBy: condBy,
      scopeDepartmentId: scopeDeptId,
      scopeLocation: data.scopeLocation ?? null,
      auditorIds: resolvedAuditors,
    } as any)
    .returning();

  return cycle;
}

export async function populateItems(cycleId: string, opts?: { role: string; userId: string }) {
  await checkCycleAccess(cycleId, opts);
  const [cycle] = await db
    .select({ scopeDepartmentId: auditCycles.scopeDepartmentId, scopeLocation: auditCycles.scopeLocation })
    .from(auditCycles)
    .where(eq(auditCycles.id, cycleId))
    .limit(1);

  if (!cycle) throw new AppError("NOT_FOUND", "Audit cycle not found.", 404);

  // scopeLocation filters which physical assets to include.
  // scopeDepartmentId is ONLY for access control — when location is blank it means "audit all".
  const conditions = [ne(assets.status, "retired")];

  if (cycle.scopeLocation) {
    // Exact or partial location match
    conditions.push(sql`lower(${assets.location}) like lower(${"%" + cycle.scopeLocation + "%"})`);
  }

  // NOTE: scopeDepartmentId intentionally NOT used as an asset filter here.
  // It controls who can manage the audit cycle, not which assets appear in scope.
  // If you need department-restricted audits, set scopeLocation to the department's floor/room.

  const all = await db
    .select({ id: assets.id, location: assets.location })
    .from(assets)
    .where(and(...conditions));

  if (all.length === 0) {
    return 0;
  }

  // Clear existing items first to allow re-populating safely
  await db.delete(auditItems).where(eq(auditItems.auditCycleId, cycleId));

  await db.insert(auditItems).values(
    all.map((a) => ({ auditCycleId: cycleId, assetId: a.id, expectedLocation: a.location })),
  );
  return all.length;
}

export async function updateCycleStatus(id: string, status: string, opts?: { role: string; userId: string }) {
  await checkCycleAccess(id, opts);
  const cycle = await getCycleById(id, opts);

  // Guard invalid transitions
  const validTransitions: Record<string, string[]> = {
    in_progress: ["planned"],
    completed:   ["in_progress"],
    cancelled:   ["planned", "in_progress"],
  };
  if (!validTransitions[status]?.includes(cycle.status)) {
    throw new AppError(
      "INVALID_TRANSITION",
      `Cannot move audit from "${cycle.status}" to "${status}".`,
      400,
    );
  }

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

    // Flip confirmed-damaged assets to "damaged" status and "damaged" condition
    const damaged = await db
      .select({ id: auditItems.id, assetId: auditItems.assetId })
      .from(auditItems)
      .where(and(eq(auditItems.auditCycleId, id), eq(auditItems.verdict, "damaged")));
    for (const item of damaged) {
      await db.update(assets).set({ status: "damaged" as any, condition: "damaged" }).where(eq(assets.id, item.assetId));
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

export async function updateItemVerdict(itemId: string, data: { verdict?: string; actualLocation?: string; discrepancy?: string; notes?: string }, opts?: { role: string; userId: string }) {
  const [item] = await db
    .select({ id: auditItems.id, auditCycleId: auditItems.auditCycleId, status: auditCycles.status })
    .from(auditItems)
    .leftJoin(auditCycles, eq(auditItems.auditCycleId, auditCycles.id))
    .where(eq(auditItems.id, itemId))
    .limit(1);

  if (!item) throw new AppError("NOT_FOUND", "Audit item not found.", 404);
  await checkCycleAccess(item.auditCycleId, opts);

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

export async function discrepancyReport(cycleId: string, opts?: { role: string; userId: string }) {
  await checkCycleAccess(cycleId, opts);
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
