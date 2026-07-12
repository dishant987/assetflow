import { db } from "../config/db";
import { notifications } from "../models/notifications";
import { eq, and, desc, sql } from "drizzle-orm";
import { getIO } from "../config/socket";

export async function create(data: {
  employeeId: number;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  const [n] = await db.insert(notifications).values(data).returning();

  const io = getIO();
  if (io) {
    io.to(`employee:${data.employeeId}`).emit("notification:new", n);
  }

  return n;
}

export async function list(employeeId: number) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.employeeId, employeeId))
    .orderBy(desc(notifications.createdAt));
}

export async function unreadCount(employeeId: number) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.employeeId, employeeId), eq(notifications.isRead, false)));
  return Number(count);
}

export async function markAsRead(id: number, employeeId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.employeeId, employeeId)));
}

export async function markAllRead(employeeId: number) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.employeeId, employeeId));
}
