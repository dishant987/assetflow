import { Request, Response } from "express";
import * as service from "../services/dashboardService";

export async function kpi(_req: Request, res: Response) {
  await service.triggerOverdueAlerts();
  const data = await service.kpi();
  res.json({ data });
}

export async function upcomingReturns(_req: Request, res: Response) {
  const data = await service.upcomingReturns();
  res.json({ data });
}

export async function overdueReturns(_req: Request, res: Response) {
  const data = await service.overdueReturns();
  res.json({ data });
}
