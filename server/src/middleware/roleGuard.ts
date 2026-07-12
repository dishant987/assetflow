import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

export function roleGuard(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError("FORBIDDEN", "Insufficient permissions", 403);
    }
    next();
  };
}
