import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export interface AuthPayload {
  userId: string;
  id: string;   // same as userId — set by authGuard for controller convenience
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new AppError("UNAUTHORIZED", "Missing or invalid token. Please sign in again.", 401);
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as { userId: string; role: string };
    // Expose both `id` and `userId` so controller code using either works
    req.user = { userId: payload.userId, id: payload.userId, role: payload.role };
    next();
  } catch {
    throw new AppError("UNAUTHORIZED", "Your session has expired. Please sign in again.", 401);
  }
}

