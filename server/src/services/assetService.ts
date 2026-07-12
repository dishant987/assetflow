import { db } from "../config/db";
import { assets } from "../models/assets";
import { assetCategories } from "../models/assetCategories";
import { allocations } from "../models/allocations";
import { employees } from "../models/employees";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { AppError } from "../utils/AppError";
import { nextAssetTag } from "../utils/assetTagGenerator";
import { eq, like, and, or, sql } from "drizzle-orm";

type CreateAsset = {
  name: string;
  description?: string;
  categoryId: string;
  serialNumber?: string;
  model?: string;
  manufacturer?: string;
  purchaseDate?: string;
  purchaseCost?: string;
  warrantyExpiry?: string;
  photoUrl?: string;
  documents?: string[];
  location?: string;
  condition?: string;
  bookable?: number;
  notes?: string;
};

export async function list(opts: { search?: string; categoryId?: string; status?: string; location?: string }) {
  const conditions = [];
  if (opts.search) {
    conditions.push(
      or(
        like(assets.assetTag, `%${opts.search}%`),
        like(assets.name, `%${opts.search}%`),
        like(assets.serialNumber, `%${opts.search}%`),
        like(assets.qrCodeValue, `%${opts.search}%`),
      ),
    );
  }
  if (opts.categoryId) conditions.push(eq(assets.categoryId, opts.categoryId));
  if (opts.status) conditions.push(eq(assets.status, opts.status as never));
  if (opts.location) conditions.push(like(assets.location, `%${opts.location}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select({
      id: assets.id,
      assetTag: assets.assetTag,
      name: assets.name,
      categoryId: assets.categoryId,
      categoryName: assetCategories.name,
      serialNumber: assets.serialNumber,
      model: assets.model,
      manufacturer: assets.manufacturer,
      status: assets.status,
      photoUrl: assets.photoUrl,
      location: assets.location,
      bookable: assets.bookable,
      qrCodeValue: assets.qrCodeValue,
      purchaseDate: assets.purchaseDate,
      purchaseCost: assets.purchaseCost,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .where(where)
    .orderBy(assets.createdAt);
}

export async function getById(id: string) {
  const [row] = await db
    .select({
      id: assets.id,
      assetTag: assets.assetTag,
      name: assets.name,
      description: assets.description,
      categoryId: assets.categoryId,
      categoryName: assetCategories.name,
      serialNumber: assets.serialNumber,
      model: assets.model,
      manufacturer: assets.manufacturer,
      purchaseDate: assets.purchaseDate,
      purchaseCost: assets.purchaseCost,
      warrantyExpiry: assets.warrantyExpiry,
      status: assets.status,
      photoUrl: assets.photoUrl,
      documents: assets.documents,
      qrCodeValue: assets.qrCodeValue,
      location: assets.location,
      notes: assets.notes,
      bookable: assets.bookable,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .where(eq(assets.id, id))
    .limit(1);

  if (!row) throw new AppError("NOT_FOUND", "Asset not found.", 404);
  return row;
}

export async function getByTag(tag: string) {
  const [row] = await db.select().from(assets).where(eq(assets.assetTag, tag)).limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Asset not found.", 404);
  return row;
}

export async function create(data: CreateAsset) {
  const tag = await nextAssetTag();

  if (data.serialNumber) {
    const [dup] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(eq(assets.serialNumber, data.serialNumber))
      .limit(1);
    if (dup) throw new AppError("DUPLICATE_SERIAL", "An asset with this serial number already exists.", 409);
  }

  const [asset] = await db
    .insert(assets)
    .values({
      assetTag: tag,
      name: data.name,
      description: data.description ?? null,
      categoryId: data.categoryId,
      serialNumber: data.serialNumber ?? null,
      model: data.model ?? null,
      manufacturer: data.manufacturer ?? null,
      purchaseDate: data.purchaseDate ?? null,
      purchaseCost: data.purchaseCost ?? null,
      warrantyExpiry: data.warrantyExpiry ?? null,
      photoUrl: data.photoUrl ?? null,
      documents: (data.documents ?? []) as unknown as never,
      qrCodeValue: tag,
      location: data.location ?? null,
      condition: data.condition ?? null,
      bookable: data.bookable ?? 0,
      notes: data.notes ?? null,
    })
    .returning();

  return { ...asset, qrCodeValue: tag };
}

export async function update(id: string, data: Partial<CreateAsset>) {
  await getById(id);

  if (data.serialNumber) {
    const [dup] = await db
      .select({ id: assets.id })
      .from(assets)
      .where(and(eq(assets.serialNumber, data.serialNumber), sql`${assets.id} != ${id}`))
      .limit(1);
    if (dup) throw new AppError("DUPLICATE_SERIAL", "An asset with this serial number already exists.", 409);
  }

  const [updated] = await db.update(assets).set(data).where(eq(assets.id, id)).returning();
  return updated;
}

export async function getAllocationHistory(assetId: string) {
  return db
    .select({
      id: allocations.id,
      allocatedAt: allocations.allocatedAt,
      returnedAt: allocations.returnedAt,
      status: allocations.status,
      notes: allocations.notes,
      employeeId: allocations.employeeId,
      employeeName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
    })
    .from(allocations)
    .leftJoin(employees, eq(allocations.employeeId, employees.id))
    .where(eq(allocations.assetId, assetId))
    .orderBy(allocations.allocatedAt);
}

export async function getMaintenanceHistory(assetId: string) {
  return db
    .select()
    .from(maintenanceRequests)
    .where(eq(maintenanceRequests.assetId, assetId))
    .orderBy(maintenanceRequests.createdAt);
}
