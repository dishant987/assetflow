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
  .then(() => logger.info("Neon DB connected"))
  .catch((e: Error) => logger.error("Neon DB connection failed", e.message));

server.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

export default server;
