import { db } from "../config/db";
import { assets } from "../models/assets";
import { assetCategories } from "../models/assetCategories";
import { allocations } from "../models/allocations";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { bookings } from "../models/bookings";
import { departments } from "../models/departments";
import { employees } from "../models/employees";
import { eq, sql, and, gte, lte } from "drizzle-orm";

async function getDeptId(opts?: { role: string; userId: string }) {
  if (opts?.role === "department_head" && opts?.userId) {
    const [emp] = await db
      .select({ departmentId: employees.departmentId })
      .from(employees)
      .where(eq(employees.id, opts.userId))
      .limit(1);
    return emp?.departmentId || null;
  }
  return null;
}

// Utilization trends: assets allocated per month over last 12 months
export async function utilizationTrends(opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT date_trunc('month', allocated_at)::date AS month, count(*)::int AS allocations
      FROM allocations
      WHERE allocated_at >= date_trunc('month', now()) - interval '12 months'
        AND department_id = ${deptId}
      GROUP BY 1 ORDER BY 1
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT date_trunc('month', allocated_at)::date AS month, count(*)::int AS allocations
    FROM allocations
    WHERE allocated_at >= date_trunc('month', now()) - interval '12 months'
    GROUP BY 1 ORDER BY 1
  `).then((r) => r.rows);
}

// Maintenance frequency per asset
export async function maintenanceFrequency(limit = 20, opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT a.id, a.asset_tag, a.name, count(m.id)::int AS count
      FROM maintenance_requests m
      JOIN assets a ON a.id = m.asset_id
      JOIN allocations al ON al.asset_id = a.id AND al.department_id = ${deptId} AND al.status = 'active'
      GROUP BY a.id, a.asset_tag, a.name
      ORDER BY count DESC
      LIMIT ${limit}
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT a.id, a.asset_tag, a.name, count(m.id)::int AS count
    FROM maintenance_requests m
    JOIN assets a ON a.id = m.asset_id
    GROUP BY a.id, a.asset_tag, a.name
    ORDER BY count DESC
    LIMIT ${limit}
  `).then((r) => r.rows);
}

// Upcoming maintenance (scheduled but not completed)
export async function upcomingMaintenance(limit = 50, opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT m.id, a.asset_tag, a.name, m.issue_description, m.priority, m.scheduled_at, m.status
      FROM maintenance_requests m
      JOIN assets a ON a.id = m.asset_id
      JOIN allocations al ON al.asset_id = a.id AND al.department_id = ${deptId} AND al.status = 'active'
      WHERE m.status IN ('reported', 'approved')
      ORDER BY m.priority ASC, m.scheduled_at ASC NULLS LAST
      LIMIT ${limit}
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT m.id, a.asset_tag, a.name, m.issue_description, m.priority, m.scheduled_at, m.status
    FROM maintenance_requests m
    JOIN assets a ON a.id = m.asset_id
    WHERE m.status IN ('reported', 'approved')
    ORDER BY m.priority ASC, m.scheduled_at ASC NULLS LAST
    LIMIT ${limit}
  `).then((r) => r.rows);
}

// Department allocation summary
export async function departmentAllocationSummary(opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT d.id, d.name, count(a.id)::int AS allocated_assets
      FROM departments d
      LEFT JOIN allocations al ON al.department_id = d.id AND al.status = 'active'
      LEFT JOIN assets a ON a.id = al.asset_id
      WHERE d.id = ${deptId}
      GROUP BY d.id, d.name
      ORDER BY d.name
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT d.id, d.name, count(a.id)::int AS allocated_assets
    FROM departments d
    LEFT JOIN allocations al ON al.department_id = d.id AND al.status = 'active'
    LEFT JOIN assets a ON a.id = al.asset_id
    GROUP BY d.id, d.name
    ORDER BY d.name
  `).then((r) => r.rows);
}

// Booking heatmap: bookings per day over last 30 days
export async function bookingHeatmap(opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT slot_start::date AS day, count(*)::int AS bookings
      FROM bookings
      JOIN employees e ON e.id = bookings.employee_id AND e.department_id = ${deptId}
      WHERE slot_start >= now() - interval '30 days' AND status != 'cancelled'
      GROUP BY 1 ORDER BY 1
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT slot_start::date AS day, count(*)::int AS bookings
    FROM bookings
    WHERE slot_start >= now() - interval '30 days' AND status != 'cancelled'
    GROUP BY 1 ORDER BY 1
  `).then((r) => r.rows);
}

// Assets by status (counts)
export async function assetsByStatus(opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT a.status, count(*)::int AS count
      FROM assets a
      JOIN allocations al ON al.asset_id = a.id AND al.department_id = ${deptId} AND al.status = 'active'
      GROUP BY a.status
      ORDER BY a.status
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT status, count(*)::int AS count
    FROM assets
    GROUP BY status
    ORDER BY status
  `).then((r) => r.rows);
}

// Assets by category (counts)
export async function assetsByCategory(opts?: { role: string; userId: string }) {
  const deptId = await getDeptId(opts);
  if (deptId) {
    return db.execute(sql`
      SELECT c.name AS category_name, count(a.id)::int AS count
      FROM asset_categories c
      LEFT JOIN assets a ON a.category_id = c.id
      LEFT JOIN allocations al ON al.asset_id = a.id AND al.department_id = ${deptId} AND al.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY c.name
    `).then((r) => r.rows);
  }
  return db.execute(sql`
    SELECT c.name AS category_name, count(a.id)::int AS count
    FROM asset_categories c
    LEFT JOIN assets a ON a.category_id = c.id
    GROUP BY c.id, c.name
    ORDER BY c.name
  `).then((r) => r.rows);
}
