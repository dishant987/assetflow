import { db } from "../config/db";
import { assets } from "../models/assets";
import { allocations } from "../models/allocations";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { bookings } from "../models/bookings";
import { transferRequests } from "../models/transferRequests";
import { employees } from "../models/employees";
import { departments } from "../models/departments";
import { activityLogs } from "../models/activityLogs";
import { sql, eq, and, gte, lte, desc, inArray } from "drizzle-orm";
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

export async function recentActivity(limit = 5) {
  const logs = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  if (logs.length === 0) return [];

  // Gather unique employee IDs and asset IDs
  const employeeIds = Array.from(new Set(logs.map((l) => l.employeeId).filter(Boolean))) as string[];
  const assetIds = Array.from(new Set(logs.map((l) => {
    const details = l.details as Record<string, any> | null;
    return details?.assetId;
  }).filter(Boolean))) as string[];

  // Fetch employees with departments in one query
  const employeeMap = new Map<string, { name: string; departmentName: string | null }>();
  if (employeeIds.length > 0) {
    const emps = await db
      .select({
        id: employees.id,
        firstName: employees.firstName,
        lastName: employees.lastName,
        departmentName: departments.name,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .where(inArray(employees.id, employeeIds));

    for (const e of emps) {
      employeeMap.set(e.id, {
        name: `${e.firstName} ${e.lastName}`,
        departmentName: e.departmentName,
      });
    }
  }

  // Fetch assets in one query
  const assetMap = new Map<string, { name: string; assetTag: string }>();
  if (assetIds.length > 0) {
    const asts = await db
      .select({
        id: assets.id,
        name: assets.name,
        assetTag: assets.assetTag,
      })
      .from(assets)
      .where(inArray(assets.id, assetIds));

    for (const a of asts) {
      assetMap.set(a.id, {
        name: a.name,
        assetTag: a.assetTag,
      });
    }
  }

  // If some logs don't have assetId in details, but we can resolve it from entity type
  const missingAssetEntityLogs = logs.filter((l) => {
    const details = l.details as Record<string, any> | null;
    return !details?.assetId && l.entityId;
  });

  if (missingAssetEntityLogs.length > 0) {
    // For allocations
    const allocEntityIds = missingAssetEntityLogs
      .filter((l) => l.entityType === "allocation")
      .map((l) => l.entityId)
      .filter(Boolean) as string[];
    if (allocEntityIds.length > 0) {
      const res = await db
        .select({ id: allocations.id, assetId: allocations.assetId })
        .from(allocations)
        .where(inArray(allocations.id, allocEntityIds));
      for (const r of res) {
        const asset = await db.select().from(assets).where(eq(assets.id, r.assetId)).limit(1);
        if (asset[0]) {
          assetMap.set(r.assetId, { name: asset[0].name, assetTag: asset[0].assetTag });
          for (const l of logs) {
            if (l.entityType === "allocation" && l.entityId === r.id) {
              l.details = { ...(l.details as Record<string, any> || {}), assetId: r.assetId };
            }
          }
        }
      }
    }

    // For bookings
    const bookingEntityIds = missingAssetEntityLogs
      .filter((l) => l.entityType === "booking")
      .map((l) => l.entityId)
      .filter(Boolean) as string[];
    if (bookingEntityIds.length > 0) {
      const res = await db
        .select({ id: bookings.id, assetId: bookings.assetId })
        .from(bookings)
        .where(inArray(bookings.id, bookingEntityIds));
      for (const r of res) {
        const asset = await db.select().from(assets).where(eq(assets.id, r.assetId)).limit(1);
        if (asset[0]) {
          assetMap.set(r.assetId, { name: asset[0].name, assetTag: asset[0].assetTag });
          for (const l of logs) {
            if (l.entityType === "booking" && l.entityId === r.id) {
              l.details = { ...(l.details as Record<string, any> || {}), assetId: r.assetId };
            }
          }
        }
      }
    }

    // For maintenance requests
    const maintEntityIds = missingAssetEntityLogs
      .filter((l) => l.entityType === "maintenance")
      .map((l) => l.entityId)
      .filter(Boolean) as string[];
    if (maintEntityIds.length > 0) {
      const res = await db
        .select({ id: maintenanceRequests.id, assetId: maintenanceRequests.assetId })
        .from(maintenanceRequests)
        .where(inArray(maintenanceRequests.id, maintEntityIds));
      for (const r of res) {
        const asset = await db.select().from(assets).where(eq(assets.id, r.assetId)).limit(1);
        if (asset[0]) {
          assetMap.set(r.assetId, { name: asset[0].name, assetTag: asset[0].assetTag });
          for (const l of logs) {
            if (l.entityType === "maintenance" && l.entityId === r.id) {
              l.details = { ...(l.details as Record<string, any> || {}), assetId: r.assetId };
            }
          }
        }
      }
    }
  }

  // Format log entries into readable messages
  return logs.map((l) => {
    const details = l.details as Record<string, any> | null;
    const assetId = details?.assetId;
    const asset = assetId ? assetMap.get(assetId) : null;
    const emp = l.employeeId ? employeeMap.get(l.employeeId) : null;

    let text = "";
    let icon = "📝";

    const assetStr = asset ? `${asset.name} (${asset.assetTag})` : "Asset";
    const empStr = emp ? emp.name : "Someone";
    const deptStr = emp?.departmentName ? ` - ${emp.departmentName}` : "";

    if (l.entityType === "allocation") {
      icon = "📦";
      if (l.action === "allocated") {
        text = `${assetStr} - allocated to ${empStr}${deptStr}`;
      } else if (l.action === "returned") {
        text = `${assetStr} - returned by ${empStr}${deptStr}`;
      } else {
        text = `${assetStr} allocation: ${l.action.replace(/_/g, " ")}`;
      }
    } else if (l.entityType === "booking") {
      icon = "📅";
      if (l.action === "booking_created") {
        text = `${assetStr} - booked by ${empStr}`;
      } else if (l.action === "booking_approved") {
        text = `${assetStr} - booking confirmed`;
      } else if (l.action === "booking_cancelled") {
        text = `${assetStr} - booking cancelled`;
      } else {
        text = `${assetStr} booking: ${l.action.replace(/_/g, " ")}`;
      }
    } else if (l.entityType === "maintenance") {
      icon = "🔧";
      if (l.action === "maintenance_created") {
        text = `${assetStr} - maintenance request raised`;
      } else if (l.action === "maintenance_completed") {
        text = `${assetStr} - maintenance resolved`;
      } else if (l.action === "maintenance_approved") {
        text = `${assetStr} - maintenance approved`;
      } else if (l.action === "maintenance_in_progress") {
        text = `${assetStr} - maintenance in progress`;
      } else {
        text = `${assetStr} maintenance: ${l.action.replace(/_/g, " ")}`;
      }
    } else {
      text = `${l.entityType.charAt(0).toUpperCase() + l.entityType.slice(1)} ${l.action.replace(/_/g, " ")} by ${empStr}`;
    }

    return {
      id: l.id,
      text,
      icon,
      createdAt: l.createdAt,
    };
  });
}

