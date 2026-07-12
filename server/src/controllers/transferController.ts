import { Request, Response } from "express";
import * as service from "../services/transferService";

export async function list(req: Request, res: Response) {
  const data = await service.list({
    userId: req.user?.userId,
    role: req.user?.role,
  });
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create(req.body);
  res.status(201).json({ data });
}

export async function approve(req: Request, res: Response) {
  const data = await service.approve(req.params.id, req.user!.userId, req.user!.role);
  res.json({ data });
}

export async function reject(req: Request, res: Response) {
  const data = await service.reject(req.params.id, req.user!.userId, req.user!.role);
  res.json({ data });
}
