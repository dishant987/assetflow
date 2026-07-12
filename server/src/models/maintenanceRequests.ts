import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { maintenanceStatus, priorityLevel } from "./enums";
import { assets } from "./assets";
import { employees } from "./employees";

export const maintenanceRequests = pgTable(
  "maintenance_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => employees.id),
    assignedTo: uuid("assigned_to").references(() => employees.id),
    issueDescription: text("issue_description").notNull(),
    photoUrl: text("photo_url"),
    priority: priorityLevel("priority").default("medium").notNull(),
    status: maintenanceStatus("status").default("reported").notNull(),
    scheduledAt: timestamp("scheduled_at"),
    completedAt: timestamp("completed_at"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    assetIdx: index("idx_maintenance_asset").on(table.assetId),
    statusIdx: index("idx_maintenance_status").on(table.status),
  }),
);
