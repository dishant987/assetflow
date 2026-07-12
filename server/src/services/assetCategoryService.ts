import { db } from "../config/db";
import { assetCategories } from "../models/assetCategories";
import { AppError } from "../utils/AppError";
import { eq } from "drizzle-orm";

export async function list() {
  return db.select().from(assetCategories).orderBy(assetCategories.name);
}

export async function getById(id: string) {
  const [c] = await db.select().from(assetCategories).where(eq(assetCategories.id, id)).limit(1);
  if (!c) throw new AppError("NOT_FOUND", "Asset category not found.", 404);
  return c;
}

export async function create(data: {
  name: string;
  code: string;
  description?: string;
  customFields?: unknown[];
}) {
  const [existing] = await db
    .select({ id: assetCategories.id })
    .from(assetCategories)
    .where(eq(assetCategories.code, data.code))
    .limit(1);
  if (existing) throw new AppError("DUPLICATE_CODE", `Category code "${data.code}" is already in use.`, 409);

  const [c] = await db.insert(assetCategories).values(data).returning();
  return c;
}

export async function update(
  id: string,
  data: { name?: string; code?: string; description?: string; customFields?: unknown[]; isActive?: boolean },
) {
  await getById(id);

  if (data.code) {
    const [dup] = await db
      .select({ id: assetCategories.id })
      .from(assetCategories)
      .where(eq(assetCategories.code, data.code))
      .limit(1);
    if (dup && dup.id !== id) {
      throw new AppError("DUPLICATE_CODE", `Category code "${data.code}" is already in use.`, 409);
    }
  }

  const [c] = await db.update(assetCategories).set(data).where(eq(assetCategories.id, id)).returning();
  return c;
}

export async function remove(id: string) {
  await getById(id);
  await db.delete(assetCategories).where(eq(assetCategories.id, id));
}
