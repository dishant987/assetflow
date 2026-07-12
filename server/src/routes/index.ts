import { Router } from "express";
import authRoutes from "./auth";
import departmentRoutes from "./departments";
import assetCategoryRoutes from "./assetCategories";
import employeeRoutes from "./employees";
import assetRoutes from "./assets";
import allocationRoutes from "./allocations";
import transferRoutes from "./transfers";
import bookingRoutes from "./bookings";
import maintenanceRoutes from "./maintenance";
import uploadRoutes from "./upload";
import auditRoutes from "./audits";
import notificationRoutes from "./notifications";
import activityLogRoutes from "./activityLogs";
import reportRoutes from "./reports";
import dashboardRoutes from "./dashboard";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/departments", departmentRoutes);
router.use("/asset-categories", assetCategoryRoutes);
router.use("/employees", employeeRoutes);
router.use("/assets", assetRoutes);
router.use("/allocations", allocationRoutes);
router.use("/transfers", transferRoutes);
router.use("/bookings", bookingRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/upload", uploadRoutes);
router.use("/audits", auditRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/reports", reportRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
