import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import * as logger from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ code: err.code, message: err.message });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Internal server error" });
}
