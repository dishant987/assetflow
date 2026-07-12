import { Request, Response } from "express";
import * as service from "../services/allocationService";

export async function list(req: Request, res: Response) {
  const data = await service.list({
    userId: req.user?.userId,
    role: req.user?.role,
  });
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const data = await service.getById(req.params.id, {
    userId: req.user?.userId,
    role: req.user?.role,
  });
  res.json({ data });
}

export async function create(req: Request, res: Response) {
  const data = await service.create(req.body, {
    userId: req.user?.userId,
    role: req.user?.role,
  });
  res.status(201).json({ data });
}

export async function returnAsset(req: Request, res: Response) {
  const data = await service.returnAsset(req.params.id, req.body.notes, {
    userId: req.user?.userId,
    role: req.user?.role,
  });
  res.json({ data });
}
