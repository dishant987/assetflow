import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/transferController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  assetId: z.number().int().positive(),
  fromEmployeeId: z.number().int().positive(),
  toEmployeeId: z.number().int().positive(),
  notes: z.string().optional(),
});

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.post("/", validate(createSchema), asyncHandler(ctrl.create));
router.post("/:id/approve", roleGuard("admin", "manager"), asyncHandler(ctrl.approve));
router.post("/:id/reject", roleGuard("admin", "manager"), asyncHandler(ctrl.reject));

export default router;
