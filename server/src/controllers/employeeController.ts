import { Request, Response } from "express";
import * as service from "../services/employeeService";

export async function list(_req: Request, res: Response) {
  const data = await service.list();
  res.json({ data });
}

export async function getById(req: Request, res: Response) {
  const data = await service.getById(Number(req.params.id));
  res.json({ data });
}

export async function promote(req: Request, res: Response) {
  const data = await service.promote(Number(req.params.id), req.body.role, req.user!.userId);
  res.json({ data });
}

export async function updateStatus(req: Request, res: Response) {
  const data = await service.updateStatus(Number(req.params.id), req.body.status);
  res.json({ data });
}
