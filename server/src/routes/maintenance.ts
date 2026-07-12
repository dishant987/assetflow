import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/maintenanceController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  assetId: z.string().uuid(),
  issueDescription: z.string().min(1, "Describe the issue"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  photoUrl: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(["approved", "in_progress", "completed", "cancelled"]),
  assignedTo: z.string().uuid().optional(),
});

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", validate(createSchema), asyncHandler(ctrl.create));
router.patch("/:id/status", roleGuard("admin", "manager"), validate(updateStatusSchema), asyncHandler(ctrl.updateStatus));

export default router;
