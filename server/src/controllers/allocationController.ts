import { Request, Response } from "express";
import * as service from "../services/allocationService";

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

export async function returnAsset(req: Request, res: Response) {
  const data = await service.returnAsset(Number(req.params.id), req.body.notes);
  res.json({ data });
}
