import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { globalLimiter } from "./middleware/rateLimiters";

const app = express();

const allowedOrigins = env.CORS_ORIGINS.split(",").map((s: string) => s.trim());
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/api", globalLimiter);

app.use("/api", routes);

app.use(errorHandler);

export default app;
