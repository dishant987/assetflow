import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/bookingController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";

const router = Router();

const createSchema = z.object({
  assetId: z.number().int().positive(),
  purpose: z.string().optional(),
  slotStart: z.string().min(1, "Start time is required"),
  slotEnd: z.string().min(1, "End time is required"),
});

const rescheduleSchema = z.object({
  slotStart: z.string().min(1),
  slotEnd: z.string().min(1),
});

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", validate(createSchema), asyncHandler(ctrl.create));
router.post("/:id/cancel", asyncHandler(ctrl.cancel));
router.post("/:id/approve", asyncHandler(ctrl.approve));
router.patch("/:id/reschedule", validate(rescheduleSchema), asyncHandler(ctrl.reschedule));

export default router;
