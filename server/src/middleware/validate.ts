import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        fields[path] = issue.message;
      }
      const first = result.error.issues[0];
      const message = first
        ? `${first.path.join(".")}: ${first.message}`
        : "Invalid input";
      throw new AppError("VALIDATION_ERROR", message, 400, fields);
    }
    req.body = result.data;
    next();
  };
}
