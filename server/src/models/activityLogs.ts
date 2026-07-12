import { pgTable, uuid, varchar, jsonb, timestamp, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id").references(() => employees.id),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: uuid("entity_id"),
    details: jsonb("details"),
    ipAddress: varchar("ip_address", { length: 45 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    employeeIdx: index("idx_activity_employee").on(table.employeeId),
    entityIdx: index("idx_activity_entity").on(table.entityType, table.entityId),
    createdAtIdx: index("idx_activity_created").on(table.createdAt),
  }),
);
