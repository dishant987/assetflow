import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/auditController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  conductedBy: z.string().uuid().optional().nullable(),
  scopeDepartmentId: z.string().uuid().optional().nullable(),
  scopeLocation: z.string().optional().nullable(),
  auditorIds: z.array(z.string().uuid()).optional().default([]),
});

const verdictSchema = z.object({
  verdict: z.enum(["found", "missing", "damaged", "mismatched"]).optional(),
  actualLocation: z.string().optional(),
  discrepancy: z.string().optional(),
  notes: z.string().optional(),
});

router.use(authGuard);

router.get("/", asyncHandler(ctrl.listCycles));
router.get("/:id", asyncHandler(ctrl.getCycleById));
router.post("/", roleGuard("admin", "manager"), validate(createSchema), asyncHandler(ctrl.createCycle));
router.post("/:id/populate", roleGuard("admin", "manager"), asyncHandler(ctrl.populateItems));
router.post("/:id/start", roleGuard("admin", "manager"), asyncHandler(ctrl.startCycle));
router.post("/:id/complete", roleGuard("admin", "manager"), asyncHandler(ctrl.completeCycle));
router.post("/:id/cancel", roleGuard("admin", "manager"), asyncHandler(ctrl.cancelCycle));
router.patch("/items/:itemId/verdict", roleGuard("admin", "manager"), validate(verdictSchema), asyncHandler(ctrl.updateItemVerdict));
router.get("/:id/discrepancies", roleGuard("admin", "manager"), asyncHandler(ctrl.discrepancyReport));

export default router;
