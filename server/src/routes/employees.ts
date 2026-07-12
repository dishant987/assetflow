import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/employeeController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const promoteSchema = z.object({
  role: z.enum(["manager", "admin"], { message: "Role must be manager or admin" }),
});

const statusSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"], { message: "Status must be active, inactive, or suspended" }),
});

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/:id/promote", roleGuard("admin"), validate(promoteSchema), asyncHandler(ctrl.promote));
router.patch("/:id/status", roleGuard("admin"), validate(statusSchema), asyncHandler(ctrl.updateStatus));

export default router;
