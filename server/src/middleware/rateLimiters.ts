// ponytail: in-memory store — limits reset on every server restart / Render redeploy.
// Swap to Redis (via `rate-limit-redis`) for multi-instance or persistent production.
import rateLimit from "express-rate-limit";
import { Request } from "express";
import { AppError } from "../utils/AppError";

const rateError = (code: string, message: string) =>
  new AppError(code, message, 429);

const keyByIpAndEmail = (req: Request) =>
  `${req.ip}_${req.body?.email || "unknown"}`;

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndEmail,
  handler: () => {
    throw rateError(
      "TOO_MANY_LOGIN_ATTEMPTS",
      "Too many login attempts. Please wait a few minutes and try again.",
    );
  },
});

export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyByIpAndEmail,
  handler: () => {
    throw rateError(
      "TOO_MANY_ATTEMPTS",
      "Too many attempts. Please wait a few minutes and try again.",
    );
  },
});

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1500,
  standardHeaders: true,
  legacyHeaders: false,
  handler: () => {
    throw rateError(
      "TOO_MANY_REQUESTS",
      "Too many requests. Please slow down and try again.",
    );
  },
});
