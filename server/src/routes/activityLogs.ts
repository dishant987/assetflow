import { Router } from "express";
import * as ctrl from "../controllers/activityLogController";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { roleGuard } from "../middleware/roleGuard";

const router = Router();
router.use(authGuard, roleGuard("admin", "manager"));

router.get("/", asyncHandler(ctrl.list));

export default router;
