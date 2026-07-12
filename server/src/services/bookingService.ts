import { db } from "../config/db";
import { bookings } from "../models/bookings";
import { assets } from "../models/assets";
import { employees } from "../models/employees";
import { AppError } from "../utils/AppError";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import * as notificationService from "./notificationService";
import * as activityLog from "./activityLogService";

export async function list() {
  return db
    .select({
      id: bookings.id,
      assetId: bookings.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      bookedBy: bookings.bookedBy,
      bookerName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      purpose: bookings.purpose,
      slotStart: bookings.slotStart,
      slotEnd: bookings.slotEnd,
      status: bookings.status,
      createdAt: bookings.createdAt,
    })
    .from(bookings)
    .leftJoin(assets, eq(bookings.assetId, assets.id))
    .leftJoin(employees, eq(bookings.bookedBy, employees.id))
    .orderBy(bookings.slotStart);
}

export async function getById(id: string) {
  const [row] = await db
    .select({
      id: bookings.id,
      assetId: bookings.assetId,
      assetTag: assets.assetTag,
      assetName: assets.name,
      bookedBy: bookings.bookedBy,
      bookerName: sql`concat(${employees.firstName}, ' ', ${employees.lastName})`,
      purpose: bookings.purpose,
      slotStart: bookings.slotStart,
      slotEnd: bookings.slotEnd,
      status: bookings.status,
    })
    .from(bookings)
    .leftJoin(assets, eq(bookings.assetId, assets.id))
    .leftJoin(employees, eq(bookings.bookedBy, employees.id))
    .where(eq(bookings.id, id))
    .limit(1);

  if (!row) throw new AppError("NOT_FOUND", "Booking not found.", 404);
  return row;
}

export async function create(data: {
  assetId: string;
  bookedBy: string;
  purpose?: string;
  slotStart: string;
  slotEnd: string;
  status?: string;
}) {
  const [asset] = await db
    .select({ id: assets.id, bookable: assets.bookable })
    .from(assets)
    .where(eq(assets.id, data.assetId))
    .limit(1);
  if (!asset) throw new AppError("NOT_FOUND", "Asset not found.", 404);
  if (!asset.bookable) throw new AppError("NOT_BOOKABLE", "This asset is not available for booking.", 400);

  const start = new Date(data.slotStart);
  const end = new Date(data.slotEnd);
  if (start >= end) throw new AppError("INVALID_SLOT", "End time must be after start time.", 400);

  // Manual overlap check since EXCLUDE constraint may not exist in all environments
  const overlapping = await db
    .select({ id: bookings.id, slotStart: bookings.slotStart, slotEnd: bookings.slotEnd })
    .from(bookings)
    .where(
      and(
        eq(bookings.assetId, data.assetId),
        sql`${bookings.status} != 'cancelled'`,
        sql`tstzrange(${bookings.slotStart}, ${bookings.slotEnd}) && tstzrange(${data.slotStart}::timestamptz, ${data.slotEnd}::timestamptz)`,
      ),
    )
    .limit(1);

  if (overlapping.length > 0) {
    const o = overlapping[0];
    throw new AppError(
      "BOOKING_OVERLAP",
      `This asset is already booked from ${o.slotStart.toISOString()} to ${o.slotEnd.toISOString()}.`,
      409,
      { conflictingSlotStart: o.slotStart.toISOString(), conflictingSlotEnd: o.slotEnd.toISOString() },
    );
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      assetId: data.assetId,
      bookedBy: data.bookedBy,
      purpose: data.purpose ?? null,
      slotStart: new Date(data.slotStart),
      slotEnd: new Date(data.slotEnd),
      status: (data.status ?? "pending") as never,
    })
    .returning();

  await notificationService.create({
    employeeId: data.bookedBy,
    title: "Booking Created",
    message: `Your booking has been created.`,
    type: "booking",
    link: `/bookings/${booking.id}`,
  });

  await activityLog.log({
    employeeId: data.bookedBy,
    action: "booking_created",
    entityType: "booking",
    entityId: booking.id,
    details: { assetId: data.assetId },
  });

  return booking;
}

export async function cancel(id: string) {
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Booking not found.", 404);

  const [updated] = await db
    .update(bookings)
    .set({ status: "cancelled" })
    .where(eq(bookings.id, id))
    .returning();

  await notificationService.create({
    employeeId: row.bookedBy,
    title: "Booking Cancelled",
    message: `Booking #${id} has been cancelled.`,
    type: "booking",
  });

  await activityLog.log({
    action: "booking_cancelled",
    entityType: "booking",
    entityId: id,
  });

  return updated;
}

export async function approve(id: string) {
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Booking not found.", 404);

  const [updated] = await db
    .update(bookings)
    .set({ status: "approved" })
    .where(eq(bookings.id, id))
    .returning();

  await notificationService.create({
    employeeId: row.bookedBy,
    title: "Booking Confirmed",
    message: `Booking #${id} has been approved.`,
    type: "booking",
    link: `/bookings/${id}`,
  });

  await notificationService.create({
    employeeId: row.bookedBy,
    title: "Booking Reminder",
    message: `Your booking #${id} is scheduled from ${row.slotStart.toISOString()} to ${row.slotEnd.toISOString()}.`,
    type: "booking_reminder",
    link: `/bookings/${id}`,
  });

  await activityLog.log({
    action: "booking_approved",
    entityType: "booking",
    entityId: id,
  });

  return updated;
}

export async function reschedule(id: string, slotStart: string, slotEnd: string) {
  const [row] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Booking not found.", 404);

  const start = new Date(slotStart);
  const end = new Date(slotEnd);
  if (start >= end) throw new AppError("INVALID_SLOT", "End time must be after start time.", 400);

  const [updated] = await db
    .update(bookings)
    .set({ slotStart: new Date(slotStart), slotEnd: new Date(slotEnd) })
    .where(eq(bookings.id, id))
    .returning();

  await notificationService.create({
    employeeId: row.bookedBy,
    title: "Booking Rescheduled",
    message: `Booking #${id} has been rescheduled.`,
    type: "booking",
  });

  return updated;
}
