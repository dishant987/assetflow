import { pgTable, serial, varchar, text, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";

export const assetCategories = pgTable("asset_categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  description: text("description"),
  customFields: jsonb("custom_fields").default([]),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
