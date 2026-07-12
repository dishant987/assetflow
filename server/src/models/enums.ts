import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["admin", "manager", "department_head", "employee"]);
export const userStatus = pgEnum("user_status", ["active", "inactive", "suspended"]);

export const assetStatus = pgEnum("asset_status", [
  "available",
  "allocated",
  "under_maintenance",
  "retired",
  "lost",
  "disposed",
  "damaged",
]);

export const allocationStatus = pgEnum("allocation_status", ["active", "returned", "transfer_pending"]);
export const transferStatus = pgEnum("transfer_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "completed",
]);
export const maintenanceStatus = pgEnum("maintenance_status", [
  "reported",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
]);
export const priorityLevel = pgEnum("priority_level", ["low", "medium", "high", "critical"]);
export const auditCycleStatus = pgEnum("audit_cycle_status", [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);
export const auditItemVerdict = pgEnum("audit_item_verdict", [
  "found",
  "missing",
  "damaged",
  "mismatched",
]);
