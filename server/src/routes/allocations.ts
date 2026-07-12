import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/allocationController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  assetId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const returnSchema = z.object({
  notes: z.string().optional(),
});

router.use(authGuard);
router.use(roleGuard("admin", "manager"));

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", validate(createSchema), asyncHandler(ctrl.create));
router.post("/:id/return", validate(returnSchema), asyncHandler(ctrl.returnAsset));

export default router;
