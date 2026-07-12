import { pgTable, serial, varchar, text, integer, timestamp, date } from "drizzle-orm/pg-core";
import { auditCycleStatus } from "./enums";
import { employees } from "./employees";

export const auditCycles = pgTable("audit_cycles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  plannedStart: date("planned_start"),
  plannedEnd: date("planned_end"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  status: auditCycleStatus("status").default("planned").notNull(),
  conductedBy: integer("conducted_by").references(() => employees.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
