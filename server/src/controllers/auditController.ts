import { Request, Response } from "express";
import * as service from "../services/auditService";

export async function listCycles(_req: Request, res: Response) {
  const data = await service.listCycles();
  res.json({ data });
}

export async function getCycleById(req: Request, res: Response) {
  const data = await service.getCycleById(req.params.id);
  res.json({ data });
}

export async function createCycle(req: Request, res: Response) {
  const data = await service.createCycle(req.body);
  res.status(201).json({ data });
}

export async function populateItems(req: Request, res: Response) {
  const count = await service.populateItems(req.params.id);
  res.json({ data: { count } });
}

export async function startCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "in_progress");
  res.json({ data });
}

export async function completeCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "completed");
  res.json({ data });
}

export async function cancelCycle(req: Request, res: Response) {
  const data = await service.updateCycleStatus(req.params.id, "cancelled");
  res.json({ data });
}

export async function updateItemVerdict(req: Request, res: Response) {
  const data = await service.updateItemVerdict(req.params.itemId, req.body);
  res.json({ data });
}

export async function discrepancyReport(req: Request, res: Response) {
  const data = await service.discrepancyReport(req.params.id);
  res.json({ data });
}
