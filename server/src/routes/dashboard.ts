import { Router } from "express";
import * as ctrl from "../controllers/dashboardController";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";

const router = Router();
router.use(authGuard);

router.get("/kpi", asyncHandler(ctrl.kpi));
router.get("/upcoming-returns", asyncHandler(ctrl.upcomingReturns));
router.get("/overdue-returns", asyncHandler(ctrl.overdueReturns));
router.get("/recent-activity", asyncHandler(ctrl.recentActivity));

export default router;
