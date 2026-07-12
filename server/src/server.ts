import app from "./app";
import { env } from "./config/env";
import * as logger from "./utils/logger";

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

export default server;


