import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { transferStatus } from "./enums";
import { assets } from "./assets";
import { employees } from "./employees";
import { departments } from "./departments";

export const transferRequests = pgTable(
  "transfer_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id),
    fromEmployeeId: uuid("from_employee_id").references(() => employees.id),
    toEmployeeId: uuid("to_employee_id").references(() => employees.id),
    fromDepartmentId: uuid("from_department_id").references(() => departments.id),
    toDepartmentId: uuid("to_department_id").references(() => departments.id),
    status: transferStatus("status").default("pending").notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    approvedAt: timestamp("approved_at"),
    rejectedAt: timestamp("rejected_at"),
    approvedBy: uuid("approved_by").references(() => employees.id),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    assetIdx: index("idx_transfer_asset").on(table.assetId),
    statusIdx: index("idx_transfer_status").on(table.status),
  }),
);
