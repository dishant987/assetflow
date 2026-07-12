import { Request, Response } from "express";
import * as service from "../services/bookingService";

export async function list(_req: Request, res: Response) {
  const data = await service.list();
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const data = await service.getById(req.params.id);
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create({ ...req.body, bookedBy: req.user!.userId });
  res.status(201).json({ data });
}

export async function cancel(req: Request, res: Response) {
  const data = await service.cancel(req.params.id, req.user!.userId, req.user!.role);
  res.json({ data });
}

export async function approve(req: Request, res: Response) {
  const data = await service.approve(req.params.id);
  res.json({ data });
}

export async function reschedule(req: Request, res: Response) {
  const data = await service.reschedule(
    req.params.id,
    req.body.slotStart,
    req.body.slotEnd,
    req.user!.userId,
    req.user!.role
  );
  res.json({ data });
}
