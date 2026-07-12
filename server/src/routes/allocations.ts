import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/allocationController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  assetId: z.string().uuid(),
  employeeId: z.string().uuid(),
  departmentId: z.string().uuid().optional(),
  notes: z.string().optional(),
  expectedReturnAt: z.string().optional(),
});

const returnSchema = z.object({
  notes: z.string().optional(),
});

router.use(authGuard);

router.get("/", roleGuard("admin", "manager", "department_head"), asyncHandler(ctrl.list));
router.get("/:id", roleGuard("admin", "manager", "department_head"), asyncHandler(ctrl.getById));
router.post("/", roleGuard("admin", "manager"), validate(createSchema), asyncHandler(ctrl.create));
router.post("/:id/return", roleGuard("admin", "manager"), validate(returnSchema), asyncHandler(ctrl.returnAsset));

export default router;
