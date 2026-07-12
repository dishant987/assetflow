import { Request, Response } from "express";
import * as service from "../services/auditService";

export async function listCycles(req: Request, res: Response) {
  const data = await service.listCycles(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function getCycleById(req: Request, res: Response) {
  const data = await service.getCycleById(req.params.id, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function createCycle(req: Request, res: Response) {
  const data = await service.createCycle(req.body);
  res.status(201).json({ data });
}

export async function populateItems(req: Request, res: Response) {
  const count = await service.populateItems(req.params.id, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  if (count === 0) {
    return res.status(200).json({ data: { message: "No assets matched the scope criteria", count } });
  }
  res.json({ data: { count } });
}

export async function startCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "in_progress", req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function completeCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "completed", req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function cancelCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "cancelled", req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function updateItemVerdict(req: Request, res: Response) {
  const data = await service.updateItemVerdict(req.params.itemId, req.body, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function discrepancyReport(req: Request, res: Response) {
  const data = await service.discrepancyReport(req.params.id, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}
