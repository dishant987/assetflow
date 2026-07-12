import { pgTable, uuid, varchar, timestamp, date } from "drizzle-orm/pg-core";
import { userRole, userStatus } from "./enums";

// FK to departments.department_id added via migration SQL to avoid circular dependency
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRole("role").default("employee").notNull(),
  status: userStatus("status").default("active").notNull(),
  departmentId: uuid("department_id"),
  phone: varchar("phone", { length: 20 }),
  designation: varchar("designation", { length: 255 }),
  joinedAt: date("joined_at"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
