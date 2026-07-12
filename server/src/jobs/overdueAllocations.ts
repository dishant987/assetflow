import cron from "node-cron";
import { db } from "../config/db";
import { allocations } from "../models/allocations";
import { sql } from "drizzle-orm";
import * as notificationService from "../services/notificationService";
import * as logger from "../utils/logger";

const OVERDUE_DAYS = 30;

export function startOverdueAllocationSweep() {
  // Nightly at 2am
  cron.schedule("0 2 * * *", async () => {
    logger.info("Running overdue allocation sweep...");

    const overdue = await db.execute(sql`
      SELECT al.id, al.employee_id
      FROM allocations al
      WHERE al.status = 'active'
        AND (
          (al.expected_return_at IS NOT NULL AND al.expected_return_at < now())
          OR
          (al.expected_return_at IS NULL AND al.allocated_at < now() - interval '30 days')
        )
        AND NOT EXISTS (
          SELECT 1 FROM notifications n
          WHERE n.type = 'overdue_return' AND n.link = '/allocations/' || al.id
        )
    `).then((r) => r.rows as { id: string; employee_id: string }[]);

    for (const o of overdue) {
      await notificationService.create({
        employeeId: o.employee_id,
        title: "Overdue Return Alert",
        message: `Allocation #${o.id} is overdue for return.`,
        type: "overdue_return",
        link: `/allocations/${o.id}`,
      });
    }

    logger.info(`Overdue sweep complete: ${overdue.length} notifications created.`);
  });
}
