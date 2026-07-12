import cron from "node-cron";
import { db } from "../config/db";
import { bookings } from "../models/bookings";
import { sql, and, gte, lte, eq } from "drizzle-orm";
import * as notificationService from "../services/notificationService";
import * as logger from "../utils/logger";

const REMINDER_WINDOW_MINUTES = 30;

export function startBookingReminderSweep() {
  // Every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("Running booking reminder sweep...");

    const now = new Date();
    const windowStart = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - 5) * 60000);
    const windowEnd = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES + 5) * 60000);

    const upcoming = await db
      .select({ id: bookings.id, bookedBy: bookings.bookedBy, slotStart: bookings.slotStart, slotEnd: bookings.slotEnd })
      .from(bookings)
      .where(
        and(
          eq(bookings.status, "approved"),
          gte(bookings.slotStart, windowStart),
          lte(bookings.slotStart, windowEnd),
        ),
      );

    for (const b of upcoming) {
      // Dedup: skip if reminder already sent
      const [existing] = await db.execute(sql`
        SELECT 1 FROM notifications
        WHERE type = 'booking_reminder' AND link = '/bookings/${b.id}'
        LIMIT 1
      `).then((r) => r.rows);

      if (existing) continue;

      await notificationService.create({
        employeeId: b.bookedBy,
        title: "Booking Reminder",
        message: `Your booking #${b.id} starts at ${b.slotStart.toLocaleString()}.`,
        type: "booking_reminder",
        link: `/bookings/${b.id}`,
      });
    }

    logger.info(`Booking reminder sweep complete: ${upcoming.length} reminders sent.`);
  });
}
