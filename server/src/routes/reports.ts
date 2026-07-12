import { Router } from "express";
import * as ctrl from "../controllers/reportController";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();
router.use(authGuard, roleGuard("admin", "manager"));

router.get("/utilization", asyncHandler(ctrl.utilizationTrends));
router.get("/maintenance-frequency", asyncHandler(ctrl.maintenanceFrequency));
router.get("/upcoming-maintenance", asyncHandler(ctrl.upcomingMaintenance));
router.get("/department-summary", asyncHandler(ctrl.departmentAllocationSummary));
router.get("/booking-heatmap", asyncHandler(ctrl.bookingHeatmap));
router.get("/by-status", asyncHandler(ctrl.assetsByStatus));
router.get("/by-category", asyncHandler(ctrl.assetsByCategory));

export default router;
