import { db } from "../config/db";
import { departments } from "../models/departments";
import { AppError } from "../utils/AppError";
import { eq } from "drizzle-orm";

export async function list() {
  return db.select().from(departments).orderBy(departments.name);
}

export async function getById(id: string) {
  const [d] = await db.select().from(departments).where(eq(departments.id, id)).limit(1);
  if (!d) throw new AppError("NOT_FOUND", "Department not found.", 404);
  return d;
}

export async function create(data: {
  name: string;
  code: string;
  description?: string;
  parentId?: string | null;
  headEmployeeId?: string;
}) {
  const [existing] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.code, data.code))
    .limit(1);
  if (existing) throw new AppError("DUPLICATE_CODE", `Department code "${data.code}" is already in use.`, 409);

  const [d] = await db.insert(departments).values(data).returning();
  return d;
}

export async function update(
  id: string,
  data: { name?: string; code?: string; description?: string; parentId?: string | null; headEmployeeId?: string | null },
) {
  await getById(id);

  if (data.code) {
    const [dup] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(eq(departments.code, data.code))
      .limit(1);
    if (dup && dup.id !== id) {
      throw new AppError("DUPLICATE_CODE", `Department code "${data.code}" is already in use.`, 409);
    }
  }

  const [d] = await db.update(departments).set(data).where(eq(departments.id, id)).returning();
  return d;
}

export async function toggleStatus(id: string) {
  const d = await getById(id);
  const [updated] = await db
    .update(departments)
    .set({ isActive: !d.isActive })
    .where(eq(departments.id, id))
    .returning();
  return updated;
}

export async function remove(id: string) {
  await getById(id);
  await db.delete(departments).where(eq(departments.id, id));
}
