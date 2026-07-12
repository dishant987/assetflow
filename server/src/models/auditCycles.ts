import { pgTable, uuid, varchar, text, timestamp, date, jsonb } from "drizzle-orm/pg-core";
import { auditCycleStatus } from "./enums";
import { employees } from "./employees";
import { departments } from "./departments";

export const auditCycles = pgTable("audit_cycles", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  plannedStart: date("planned_start"),
  plannedEnd: date("planned_end"),
  scopeDepartmentId: uuid("scope_department_id").references(() => departments.id),
  scopeLocation: varchar("scope_location", { length: 255 }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: auditCycleStatus("status").default("planned").notNull(),
  conductedBy: uuid("conducted_by").references(() => employees.id),
  auditorIds: jsonb("auditor_ids").default([]),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
