import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id),
  tokenHash: varchar("token_hash", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
