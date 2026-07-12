import { sql } from "drizzle-orm";
import { db } from "./config/db";
import { employees } from "./models/employees";
import { assetCategories } from "./models/assetCategories";
import bcrypt from "bcrypt";

/*
 * Creates the asset_tag_seq sequence and a bootstrap Admin account.
 * Run once against a fresh database: npx tsx src/seed.ts
 *
 * The Admin is created directly (bypasses the signup-is-employee-only rule)
 * so there is at least one admin who can promote other users.
 */

async function seed() {
  // asset_tag_seq — used by the service layer to generate AF-XXXX tags
  await db.execute(sql`CREATE SEQUENCE IF NOT EXISTS asset_tag_seq START 1`);

  // Bootstrap admin
  const existing = await db
    .select({ id: employees.id })
    .from(employees)
    .where(sql`email = 'admin@assetflow.com'`)
    .limit(1);

  if (existing.length > 0) {
    console.log("Admin already exists, skipping.");
  } else {
    const hash = await bcrypt.hash("admin123", 10);
    await db.insert(employees).values({
      employeeCode: "ADMIN-001",
      firstName: "System",
      lastName: "Admin",
      email: "admin@assetflow.com",
      password: hash,
      role: "admin",
      status: "active",
    });
    console.log("Admin account created (admin@assetflow.com / admin123)");
  }

  // Test accounts for each role (skip if already exist)
  const testUsers = [
    { employeeCode: "MGR-001", firstName: "Asset", lastName: "Manager", email: "manager@assetflow.com", role: "manager" as const, password: "manager123" },
    { employeeCode: "DH-001", firstName: "Dept", lastName: "Head", email: "depthead@assetflow.com", role: "department_head" as const, password: "dept123" },
    { employeeCode: "EMP-001", firstName: "Jane", lastName: "Employee", email: "employee@assetflow.com", role: "employee" as const, password: "emp123" },
  ];
  for (const u of testUsers) {
    const exists = await db.select({ id: employees.id }).from(employees).where(sql`email = ${u.email}`).limit(1);
    if (exists.length === 0) {
      const hash = await bcrypt.hash(u.password, 10);
      await db.insert(employees).values({ ...u, password: hash, status: "active" });
    }
  }
  console.log("Test accounts seeded (Admin / Manager / Dept Head / Employee).");

  // Default asset categories
  const cats = [
    { name: "Laptops", code: "LAP", description: "Laptops and notebooks" },
    { name: "Desktops", code: "DES", description: "Desktop computers" },
    { name: "Monitors", code: "MON", description: "Displays and screens" },
    { name: "Peripherals", code: "PER", description: "Keyboards, mice, headsets" },
    { name: "Networking", code: "NET", description: "Routers, switches, access points" },
    { name: "Servers", code: "SRV", description: "Server hardware" },
    { name: "Mobile Devices", code: "MOB", description: "Phones and tablets" },
    { name: "Furniture", code: "FUR", description: "Desks, chairs, fixtures" },
  ];
  for (const c of cats) {
    const exists = await db.select({ id: assetCategories.id }).from(assetCategories).where(sql`code = ${c.code}`).limit(1);
    if (exists.length === 0) await db.insert(assetCategories).values(c);
  }
  console.log("Default asset categories seeded.");
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
