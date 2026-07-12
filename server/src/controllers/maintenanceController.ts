import { Request, Response } from "express";
import * as service from "../services/maintenanceService";

export async function list(_req: Request, res: Response) {
  const data = await service.list();
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const data = await service.getById(Number(req.params.id));
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create({ ...req.body, requestedBy: req.user!.userId });
  res.status(201).json({ data });
}

export async function updateStatus(req: Request, res: Response) {
  const data = await service.updateStatus(Number(req.params.id), req.body.status, req.body.assignedTo);
  res.json({ data });
}
