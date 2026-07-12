import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  date,
  index,
} from "drizzle-orm/pg-core";
import { assetStatus } from "./enums";
import { assetCategories } from "./assetCategories";

export const assets = pgTable(
  "assets",
  {
    id: serial("id").primaryKey(),
    assetTag: varchar("asset_tag", { length: 50 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => assetCategories.id),
    serialNumber: varchar("serial_number", { length: 255 }),
    model: varchar("model", { length: 255 }),
    manufacturer: varchar("manufacturer", { length: 255 }),
    purchaseDate: date("purchase_date"),
    purchaseCost: numeric("purchase_cost", { precision: 12, scale: 2 }),
    warrantyExpiry: date("warranty_expiry"),
    status: assetStatus("status").default("available").notNull(),
    photoUrl: text("photo_url"),
    documents: jsonb("documents").default([]),
    qrCodeValue: varchar("qr_code_value", { length: 255 }).notNull().unique(),
    location: varchar("location", { length: 255 }),
    bookable: integer("bookable").default(0).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    statusIdx: index("idx_assets_status").on(table.status),
    categoryIdx: index("idx_assets_category").on(table.categoryId),
  }),
);
