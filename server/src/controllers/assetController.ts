import { Request, Response } from "express";
import * as service from "../services/assetService";

export async function list(req: Request, res: Response) {
  const data = await service.list({
    search: req.query.search as string,
    categoryId: req.query.categoryId ? Number(req.query.categoryId) : undefined,
    status: req.query.status as string,
    location: req.query.location as string,
  });
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const data = await service.getById(Number(req.params.id));
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create(req.body);
  res.status(201).json({ data });
}

export async function update(req: Request, res: Response) {
  const data = await service.update(Number(req.params.id), req.body);
  res.json({ data });
}

export async function getAllocationHistory(req: Request, res: Response) {
  const data = await service.getAllocationHistory(Number(req.params.id));
  res.json({ data });
}

export async function getMaintenanceHistory(req: Request, res: Response) {
  const data = await service.getMaintenanceHistory(Number(req.params.id));
  res.json({ data });
}
