import { db } from "../config/db";
import { activityLogs } from "../models/activityLogs";
import { eq, and, gte, lte, like, desc, sql } from "drizzle-orm";

export async function log(data: {
  employeeId?: number;
  action: string;
  entityType: string;
  entityId?: number;
  details?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.insert(activityLogs).values({
    employeeId: data.employeeId ?? null,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId ?? null,
    details: (data.details ?? null) as never,
    ipAddress: data.ipAddress ?? null,
  });
}

export async function list(opts: {
  entityType?: string;
  entityId?: number;
  action?: string;
  employeeId?: number;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const conditions = [];
  if (opts.entityType) conditions.push(eq(activityLogs.entityType, opts.entityType));
  if (opts.entityId) conditions.push(eq(activityLogs.entityId, opts.entityId));
  if (opts.action) conditions.push(eq(activityLogs.action, opts.action));
  if (opts.employeeId) conditions.push(eq(activityLogs.employeeId, opts.employeeId));
  if (opts.from) conditions.push(gte(activityLogs.createdAt, new Date(opts.from)));
  if (opts.to) conditions.push(lte(activityLogs.createdAt, new Date(opts.to)));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(activityLogs)
    .where(where)
    .orderBy(desc(activityLogs.createdAt))
    .limit(opts.limit ?? 200)
    .offset(opts.offset ?? 0);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(activityLogs)
    .where(where);

  return { rows, total: Number(count) };
}
