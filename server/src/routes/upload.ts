import { Router } from "express";
import { upload } from "../config/upload";
import { uploadFile } from "../controllers/uploadController";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";

const router = Router();

router.use(authGuard);
router.post("/", upload.single("file"), asyncHandler(uploadFile));

export default router;
