import { db } from "../config/db";
import { maintenanceRequests } from "../models/maintenanceRequests";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { AppError } from "../utils/AppError";
import { eq, sql } from "drizzle-orm";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

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

  await notificationService.create({
    employeeId: data.requestedBy,
    title: "Maintenance Request Created",
    message: `Your maintenance request has been submitted.`,
    type: "maintenance",
    link: `/maintenance/${req.id}`,
  });

  await activityLog.log({
    employeeId: data.requestedBy,
    action: "maintenance_created",
    entityType: "maintenance",
    entityId: req.id,
    details: { assetId: data.assetId },
  });

  return req;
}

const validTransitions: Record<string, string[]> = {
  reported: ["approved", "cancelled"],
  approved: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export async function updateStatus(id: number, status: string, assignedTo?: number) {
  const existing = await getById(id);

  const allowed = validTransitions[existing.status] ?? [];
  if (!allowed.includes(status)) {
    throw new AppError(
      "INVALID_STATE_TRANSITION",
      `Cannot transition from "${existing.status}" to "${status}". Allowed: ${allowed.join(", ") || "none"}.`,
      400,
    );
  }

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

  await notificationService.create({
    employeeId: existing.requestedBy,
    title: `Maintenance ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: `Maintenance request #${id} has been ${status}.`,
    type: "maintenance",
    link: `/maintenance/${id}`,
  });

  await activityLog.log({
    employeeId: assignedTo ?? existing.requestedBy,
    action: `maintenance_${status}`,
    entityType: "maintenance",
    entityId: id,
  });

  return updated;
}
