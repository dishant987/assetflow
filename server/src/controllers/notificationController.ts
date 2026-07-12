import { Request, Response } from "express";
import * as service from "../services/notificationService";

export async function list(_req: Request, res: Response) {
  const data = await service.list(Number(_req.query.employeeId || _req.user!.userId));
  res.json({ data });
}

export async function unreadCount(req: Request, res: Response) {
  const count = await service.unreadCount(Number(req.query.employeeId || req.user!.userId));
  res.json({ data: { count } });
}

export async function markAsRead(req: Request, res: Response) {
  await service.markAsRead(Number(req.params.id), req.user!.userId);
  res.json({ data: { ok: true } });
}

export async function markAllRead(req: Request, res: Response) {
  await service.markAllRead(req.user!.userId);
  res.json({ data: { ok: true } });
}
