import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/assetController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  categoryId: z.string().uuid("Category is required"),
  serialNumber: z.string().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseCost: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  condition: z.string().optional(),
  photoUrl: z.string().optional(),
  documents: z.array(z.string()).optional(),
  location: z.string().optional(),
  bookable: z.number().int().min(0).max(1).optional(),
  status: z.enum(["available", "allocated", "under_maintenance", "retired", "lost", "disposed"]).optional(),
  notes: z.string().optional(),
});

const updateSchema = createSchema.partial();

router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", asyncHandler(ctrl.getById));
router.post("/", roleGuard("admin", "manager"), validate(createSchema), asyncHandler(ctrl.create));
router.patch("/:id", roleGuard("admin", "manager"), validate(updateSchema), asyncHandler(ctrl.update));
router.get("/:id/allocations", asyncHandler(ctrl.getAllocationHistory));
router.get("/:id/maintenance", asyncHandler(ctrl.getMaintenanceHistory));

export default router;
