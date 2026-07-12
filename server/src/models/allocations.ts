import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { allocationStatus } from "./enums";
import { assets } from "./assets";
import { employees } from "./employees";
import { departments } from "./departments";

export const allocations = pgTable(
  "allocations",
  {
    id: serial("id").primaryKey(),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id),
    departmentId: integer("department_id").references(() => departments.id),
    allocatedAt: timestamp("allocated_at").defaultNow().notNull(),
    returnedAt: timestamp("returned_at"),
    status: allocationStatus("status").default("active").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    oneActivePerAsset: uniqueIndex("one_active_allocation_per_asset")
      .on(table.assetId)
      .where(sql`status = 'active'`),
    assetIdx: index("idx_allocations_asset").on(table.assetId),
    employeeIdx: index("idx_allocations_employee").on(table.employeeId),
  }),
);
