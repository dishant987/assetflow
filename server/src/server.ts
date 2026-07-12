import app from "./app";
import { createServer } from "http";
import { env } from "./config/env";
import { initSocket } from "./config/socket";
import { startJobs } from "./jobs";
import * as logger from "./utils/logger";
import { sql } from "drizzle-orm";
import { db } from "./config/db";

const server = createServer(app);

initSocket(server);
startJobs();

db.execute(sql`SELECT 1`)
  .then(async () => {
    logger.info("Neon DB connected");
    try {
      await db.execute(sql`ALTER TYPE asset_status ADD VALUE IF NOT EXISTS 'damaged'`);
      logger.info("Ensured 'damaged' is added to asset_status enum type");
    } catch (e: any) {
      logger.error("Failed to alter asset_status enum (may already exist or be in transaction): " + e.message);
    }
  })
  .catch((e: Error) => logger.error("Neon DB connection failed", e.message));

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

export default server;
