import { Router } from "express";
import { z } from "zod";
import * as ctrl from "../controllers/authController";
import { validate } from "../middleware/validate";
import { asyncHandler } from "../utils/asyncHandler";
import { authGuard } from "../middleware/authGuard";
import { loginLimiter, otpLimiter } from "../middleware/rateLimiters";

const router = Router();

const signupSchema = z.object({
  employeeCode: z.string().min(1, "Employee code is required"),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
  designation: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const forgotSchema = z.object({ email: z.string().email("Enter a valid email address") });

const otpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  otp: z.string().length(6, "Code must be 6 digits"),
});

const resetSchema = z.object({
  resetToken: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/signup", validate(signupSchema), asyncHandler(ctrl.signup));
router.post("/login", loginLimiter, validate(loginSchema), asyncHandler(ctrl.login));
router.post("/refresh", asyncHandler(ctrl.refresh));
router.get("/session", authGuard, asyncHandler(ctrl.getSession));
router.post("/logout", authGuard, asyncHandler(ctrl.logout));
router.post("/forgot-password", otpLimiter, validate(forgotSchema), asyncHandler(ctrl.forgotPassword));
router.post("/verify-otp", otpLimiter, validate(otpSchema), asyncHandler(ctrl.verifyOtp));
router.post("/reset-password", validate(resetSchema), asyncHandler(ctrl.resetPassword));

export default router;
