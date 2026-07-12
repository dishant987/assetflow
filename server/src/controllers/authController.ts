import { Request, Response } from "express";
import * as authService from "../services/authService";
import { AppError } from "../utils/AppError";

export async function signup(req: Request, res: Response) {
  const user = await authService.signup(req.body);
  res.status(201).json({ data: user });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const result = await authService.login(email, password);

  const isProd = (process.env.NODE_ENV ?? "development") === "production";
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/auth",
  });

  res.json({ data: { user: result.user, accessToken: result.accessToken } });
}

export async function refresh(req: Request, res: Response) {
  const raw = req.cookies?.refreshToken;
  if (!raw) {
    throw new AppError("NO_SESSION", "No session found. Please sign in.", 401);
  }
  const result = await authService.refresh(raw);
  res.json({ data: result });
}

export async function logout(req: Request, res: Response) {
  const raw = req.cookies?.refreshToken;
  if (raw) await authService.logout(raw);
  res.clearCookie("refreshToken", { path: "/api/auth" });
  res.json({ data: { message: "Signed out." } });
}

export async function getSession(req: Request, res: Response) {
  const user = await authService.getSession(req.user!.userId);
  res.json({ data: user });
}

export async function forgotPassword(req: Request, res: Response) {
  await authService.forgotPassword(req.body.email);
  res.json({
    data: { message: "If an account exists for this email, we've sent a code." },
  });
}

export async function verifyOtp(req: Request, res: Response) {
  const result = await authService.verifyOtp(req.body.email, req.body.otp);
  res.json({ data: result });
}

export async function resetPassword(req: Request, res: Response) {
  await authService.resetPassword(req.body.resetToken, req.body.newPassword);
  res.json({ data: { message: "Password updated. Please sign in with your new password." } });
}

export async function updateProfile(req: Request, res: Response) {
  const user = await authService.updateProfile(req.user!.userId, req.body);
  res.json({ data: user });
}

export async function changePassword(req: Request, res: Response) {
  await authService.changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
  res.json({ data: { message: "Password changed. Please sign in again." } });
}
