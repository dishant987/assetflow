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
    const body: Record<string, unknown> = { code: err.code, message: err.message };
    if (err.fields) body.fields = err.fields;
    res.status(err.statusCode).json({ error: body });
    return;
  }

  logger.error("Unhandled error", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong on our end. Please try again.",
    },
  });
}
