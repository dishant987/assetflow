import { Request, Response } from "express";
import * as service from "../services/reportService";

export async function utilizationTrends(req: Request, res: Response) {
  const data = await service.utilizationTrends(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function maintenanceFrequency(req: Request, res: Response) {
  const data = await service.maintenanceFrequency(20, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function upcomingMaintenance(req: Request, res: Response) {
  const data = await service.upcomingMaintenance(50, req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function departmentAllocationSummary(req: Request, res: Response) {
  const data = await service.departmentAllocationSummary(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function bookingHeatmap(req: Request, res: Response) {
  const data = await service.bookingHeatmap(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function assetsByStatus(req: Request, res: Response) {
  const data = await service.assetsByStatus(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}

export async function assetsByCategory(req: Request, res: Response) {
  const data = await service.assetsByCategory(req.user ? { role: req.user.role, userId: req.user.id } : undefined);
  res.json({ data });
}
