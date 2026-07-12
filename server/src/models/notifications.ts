import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { employees } from "./employees";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => employees.id),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    link: text("link"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    employeeIdx: index("idx_notifications_employee").on(table.employeeId),
    unreadIdx: index("idx_notifications_unread").on(table.employeeId, table.isRead),
  }),
);
