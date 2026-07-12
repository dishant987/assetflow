import { db } from "../config/db";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { notifications } from "../models/notifications";
import { AppError } from "../utils/AppError";
import { eq, sql } from "drizzle-orm";

export async function list() {
  return db
    .select({
      id: maintenanceRequests.id,
      assetId: maintenanceRequests.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      requestedBy: maintenanceRequests.requestedBy,
      requesterName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      issueDescription: maintenanceRequests.issueDescription,
      photoUrl: maintenanceRequests.photoUrl,
      priority: maintenanceRequests.priority,
      status: maintenanceRequests.status,
      scheduledAt: maintenanceRequests.scheduledAt,
      completedAt: maintenanceRequests.completedAt,
      notes: maintenanceRequests.notes,
      createdAt: maintenanceRequests.createdAt,
    })
    .from(maintenanceRequests)
    .leftJoin(assets, eq(maintenanceRequests.assetId, assets.id))
    .leftJoin(employees, eq(maintenanceRequests.requestedBy, employees.id))
    .orderBy(maintenanceRequests.createdAt);
}

export async function getById(id: number) {
  const [row] = await db
    .select({
      id: maintenanceRequests.id,
      assetId: maintenanceRequests.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      requestedBy: maintenanceRequests.requestedBy,
      requesterName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      issueDescription: maintenanceRequests.issueDescription,
      photoUrl: maintenanceRequests.photoUrl,
      priority: maintenanceRequests.priority,
      status: maintenanceRequests.status,
      scheduledAt: maintenanceRequests.scheduledAt,
      completedAt: maintenanceRequests.completedAt,
      notes: maintenanceRequests.notes,
      createdAt: maintenanceRequests.createdAt,
      updatedAt: maintenanceRequests.updatedAt,
    })
    .from(maintenanceRequests)
    .leftJoin(assets, eq(maintenanceRequests.assetId, assets.id))
    .leftJoin(employees, eq(maintenanceRequests.requestedBy, employees.id))
    .where(eq(maintenanceRequests.id, id))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Maintenance request not found.", 404);
  return row;
}

export async function create(data: {
  assetId: number;
  requestedBy: number;
  issueDescription: string;
  priority?: string;
  photoUrl?: string;
}) {
  const [req] = await db.insert(maintenanceRequests).values({
    assetId: data.assetId,
    requestedBy: data.requestedBy,
    issueDescription: data.issueDescription,
    photoUrl: data.photoUrl ?? null,
    priority: (data.priority ?? "medium") as never,
  }).returning();

  await db.insert(notifications).values({
    employeeId: data.requestedBy,
    title: "Maintenance Request Created",
    message: `Your maintenance request has been submitted.`,
    type: "maintenance",
    link: `/maintenance/${req.id}`,
  });

  return req;
}

export async function updateStatus(id: number, status: string, assignedTo?: number) {
  const existing = await getById(id);

  const updateData: Record<string, unknown> = { status };

  if (status === "in_progress" && assignedTo) {
    updateData.assignedTo = assignedTo;
  }
  if (status === "completed") {
    updateData.completedAt = new Date();
    // Set asset back to available
    await db.update(assets).set({ status: "available" }).where(eq(assets.id, existing.assetId));
  }

  if (status === "approved") {
    // Set asset to under_maintenance
    await db.update(assets).set({ status: "under_maintenance" }).where(eq(assets.id, existing.assetId));
  }

  const [updated] = await db
    .update(maintenanceRequests)
    .set(updateData)
    .where(eq(maintenanceRequests.id, id))
    .returning();
  return updated;
}
