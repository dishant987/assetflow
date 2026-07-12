import { Request, Response } from "express";
import * as service from "../services/reportService";

export async function utilizationTrends(_req: Request, res: Response) {
  const data = await service.utilizationTrends();
  res.json({ data });
}

export async function maintenanceFrequency(_req: Request, res: Response) {
  const data = await service.maintenanceFrequency();
  res.json({ data });
}

export async function upcomingMaintenance(_req: Request, res: Response) {
  const data = await service.upcomingMaintenance();
  res.json({ data });
}

export async function departmentAllocationSummary(_req: Request, res: Response) {
  const data = await service.departmentAllocationSummary();
  res.json({ data });
}

export async function bookingHeatmap(_req: Request, res: Response) {
  const data = await service.bookingHeatmap();
  res.json({ data });
}

export async function assetsByStatus(_req: Request, res: Response) {
  const data = await service.assetsByStatus();
  res.json({ data });
}

export async function assetsByCategory(_req: Request, res: Response) {
  const data = await service.assetsByCategory();
  res.json({ data });
}
