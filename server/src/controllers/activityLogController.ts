import { Request, Response } from "express";
import * as service from "../services/activityLogService";

export async function list(req: Request, res: Response) {
  const { entityType, entityId, action, employeeId, from, to, limit, offset } = req.query;
  const data = await service.list({
    entityType: entityType as string,
    entityId: entityId as string | undefined,
    action: action as string,
    employeeId: employeeId as string | undefined,
    from: from as string,
    to: to as string,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
  });
  res.json({ data });
}
