import { db } from "../config/db";
import { assets } from "../models/assets";
import { allocations } from "../models/allocations";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { bookings } from "../models/bookings";
import { transferRequests } from "../models/transferRequests";
import { employees } from "../models/employees";
import { sql, eq, and, gte, lte } from "drizzle-orm";
import * as notificationService from "./notificationService";

export async function kpi() {
  const [[available], [allocated], [underMaintenance], [maintenanceToday], [activeBookings], [pendingTransfers], [upcomingReturns]] =
    await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(assets).where(eq(assets.status, "available")),
      db.select({ count: sql<number>`count(*)` }).from(assets).where(eq(assets.status, "allocated")),
      db.select({ count: sql<number>`count(*)` }).from(assets).where(eq(assets.status, "under_maintenance")),
      db.select({ count: sql<number>`count(*)` }).from(maintenanceRequests)
        .where(and(gte(maintenanceRequests.createdAt, sql`now() - interval '24 hours'`))),
      db.select({ count: sql<number>`count(*)` }).from(bookings)
        .where(and(eq(bookings.status, "approved"), gte(bookings.slotEnd, sql`now()`))),
      db.select({ count: sql<number>`count(*)` }).from(transferRequests).where(eq(transferRequests.status, "pending")),
      db.select({ count: sql<number>`count(*)` }).from(allocations).where(eq(allocations.status, "active")),
    ]);

  return {
    availableAssets: Number(available.count),
    allocatedAssets: Number(allocated.count),
    underMaintenance: Number(underMaintenance.count),
    maintenanceToday: Number(maintenanceToday.count),
    activeBookings: Number(activeBookings.count),
    pendingTransfers: Number(pendingTransfers.count),
    upcomingReturns: Number(upcomingReturns.count),
  };
}

export async function triggerOverdueAlerts() {
  // ponytail: one-shot overdue notification per allocation; idempotent via existing notification check
  const overdue = await db.execute(sql`
    SELECT al.id, al.employee_id
    FROM allocations al
    WHERE al.status = 'active' AND al.allocated_at < now() - interval '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.type = 'overdue_return' AND n.link = '/allocations/' || al.id
      )
  `).then((r) => r.rows as { id: string; employee_id: string }[]);

  for (const o of overdue) {
    await notificationService.create({
      employeeId: o.employee_id,
      title: "Overdue Return Alert",
      message: `Allocation #${o.id} is overdue for return.`,
      type: "overdue_return",
      link: `/allocations/${o.id}`,
    });
  }

  return overdue.length;
}

export async function upcomingReturns(limit = 10) {
  return db.execute(sql`
    SELECT al.id, a.asset_tag, a.name AS asset_name,
      concat(e.first_name, ' ', e.last_name) AS employee_name,
      al.allocated_at
    FROM allocations al
    JOIN assets a ON a.id = al.asset_id
    JOIN employees e ON e.id = al.employee_id
    WHERE al.status = 'active'
    ORDER BY al.allocated_at ASC
    LIMIT ${limit}
  `).then((r) => r.rows);
}

export async function overdueReturns() {
  return db.execute(sql`
    SELECT al.id, a.asset_tag, a.name AS asset_name,
      concat(e.first_name, ' ', e.last_name) AS employee_name,
      al.allocated_at,
      CASE
        WHEN al.expected_return_at IS NOT NULL THEN (now() - al.expected_return_at)::text
        ELSE (now() - al.allocated_at)::text
      END AS duration
    FROM allocations al
    JOIN assets a ON a.id = al.asset_id
    JOIN employees e ON e.id = al.employee_id
    WHERE al.status = 'active'
      AND (
        (al.expected_return_at IS NOT NULL AND al.expected_return_at < now())
        OR (al.expected_return_at IS NULL AND al.allocated_at < now() - interval '30 days')
      )
    ORDER BY al.allocated_at ASC
  `).then((r) => r.rows);
}
