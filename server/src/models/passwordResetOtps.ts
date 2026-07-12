import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const passwordResetOtps = pgTable("password_reset_otps", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id),
  otpHash: varchar("otp_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
