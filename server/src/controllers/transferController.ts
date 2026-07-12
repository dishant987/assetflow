import { Request, Response } from "express";
import * as service from "../services/transferService";

export async function list(_req: Request, res: Response) {
  const data = await service.list();
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create(req.body);
  res.status(201).json({ data });
}

export async function approve(req: Request, res: Response) {
  const data = await service.approve(req.params.id, req.user!.userId);
  res.json({ data });
}

export async function reject(req: Request, res: Response) {
  const data = await service.reject(req.params.id, req.user!.userId);
  res.json({ data });
}
