import { Router } from "express";
import * as ctrl from "../controllers/notificationController";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";

const router = Router();
router.use(authGuard);

router.get("/", asyncHandler(ctrl.list));
router.get("/unread", asyncHandler(ctrl.unreadCount));
router.put("/:id/read", asyncHandler(ctrl.markAsRead));
router.put("/read-all", asyncHandler(ctrl.markAllRead));

export default router;
