import { Request, Response } from "express";
import * as service from "../services/assetCategoryService";

export async function list(_req: Request, res: Response) {
  const data = await service.list();
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

export async function remove(req: Request, res: Response) {
  await service.remove(Number(req.params.id));
  res.json({ data: null });
}
