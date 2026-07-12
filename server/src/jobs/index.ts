import { startOverdueAllocationSweep } from "./overdueAllocations";
import { startBookingReminderSweep } from "./bookingReminders";
import * as logger from "../utils/logger";

export function startJobs() {
  logger.info("Starting scheduled jobs...");
  startOverdueAllocationSweep();
  startBookingReminderSweep();
  logger.info("Scheduled jobs started.");
}
