import { pgTable, serial, integer, text, timestamp, index } from "drizzle-orm/pg-core";
import { bookingStatus } from "./enums";
import { assets } from "./assets";
import { employees } from "./employees";

/*
 * Drizzle-kit cannot express EXCLUDE constraints natively.
 * After running `drizzle-kit generate`, hand-edit the generated SQL to add:
 *
 *   ALTER TABLE bookings ADD CONSTRAINT no_overlap_booking
 *   EXCLUDE USING gist (asset_id WITH =, tstzrange(slot_start, slot_end) WITH &&)
 *   WHERE (status != 'cancelled');
 *
 * This is the source-of-truth constraint that prevents double-booking.
 * Application-layer checks are UX-only; this is the correctness guarantee.
 */

export const bookings = pgTable(
  "bookings",
  {
    id: serial("id").primaryKey(),
    assetId: integer("asset_id")
      .notNull()
      .references(() => assets.id),
    bookedBy: integer("booked_by")
      .notNull()
      .references(() => employees.id),
    purpose: text("purpose"),
    slotStart: timestamp("slot_start", { withTimezone: true }).notNull(),
    slotEnd: timestamp("slot_end", { withTimezone: true }).notNull(),
    status: bookingStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    assetIdx: index("idx_bookings_asset").on(table.assetId),
    statusIdx: index("idx_bookings_status").on(table.status),
  }),
);
