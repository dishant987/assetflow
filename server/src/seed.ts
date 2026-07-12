import { sql } from "drizzle-orm";
import { db } from "./config/db";
import { employees } from "./models/employees";
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
    return;
  }

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

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
