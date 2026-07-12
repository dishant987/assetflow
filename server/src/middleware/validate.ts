import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      throw new AppError("VALIDATION_ERROR", result.error.errors[0]?.message || "Invalid input");
    }
    req.body = result.data;
    next();
  };
}
