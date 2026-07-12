import { pgTable, serial, integer, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { auditItemVerdict } from "./enums";
import { auditCycles } from "./auditCycles";
import { assets } from "./assets";

export const auditItems = pgTable(
  "audit_items",
  {
    id: serial("id").primaryKey(),
    auditCycleId: integer("audit_cycle_id")
      .notNull()
      .references(() => auditCycles.id),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id),
    expectedLocation: varchar("expected_location", { length: 255 }),
    actualLocation: varchar("actual_location", { length: 255 }),
    verdict: auditItemVerdict("verdict"),
    discrepancy: text("discrepancy"),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    cycleIdx: index("idx_audit_items_cycle").on(table.auditCycleId),
    assetIdx: index("idx_audit_items_asset").on(table.assetId),
  }),
);
