import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/departmentController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
  headEmployeeId: z.string().uuid().nullable().optional(),
});

const updateSchema = createSchema.partial();

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", roleGuard("admin"), validate(createSchema), asyncHandler(ctrl.create));
router.patch("/:id", roleGuard("admin"), validate(updateSchema), asyncHandler(ctrl.update));
router.patch("/:id/status", roleGuard("admin"), asyncHandler(ctrl.toggleStatus));
router.delete("/:id", roleGuard("admin"), asyncHandler(ctrl.remove));

export default router;
