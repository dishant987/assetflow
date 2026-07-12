import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../config/db";
import { env } from "../config/env";
import { employees } from "../models/employees";
import { passwordResetOtps } from "../models/passwordResetOtps";
import { refreshTokens } from "../models/refreshTokens";
import { AppError } from "../utils/AppError";
import { generateOtp } from "../utils/otpGenerator";
import { sendMail } from "../config/mailer";
import { otpEmail } from "../utils/emailTemplates";
import { eq, and, isNull, sql, lte, desc } from "drizzle-orm";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY_DAYS = 7;
const REFRESH_EXPIRY_MS = REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
const RESET_TOKEN_EXPIRY = "10m";
const MAX_OTP_ATTEMPTS = 5;

/* ───────── helpers ───────── */

function signAccess(userId: number, role: string) {
  return jwt.sign({ userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function signRefresh(userId: number) {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRY_DAYS}d` });
}

function signResetToken(userId: number) {
  return jwt.sign({ userId, purpose: "password-reset" }, env.JWT_REFRESH_SECRET, {
    expiresIn: RESET_TOKEN_EXPIRY,
  });
}

function sanitise(emp: Record<string, unknown>) {
  const { password, ...rest } = emp;
  return rest;
}

/* ───────── signup ───────── */

export async function signup(data: {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  designation?: string;
}) {
  const existing = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.email, data.email))
    .limit(1);
  if (existing.length > 0) {
    throw new AppError("EMAIL_TAKEN", "An account with this email already exists.", 409);
  }

  const codeDup = await db
    .select({ id: employees.id })
    .from(employees)
    .where(eq(employees.employeeCode, data.employeeCode))
    .limit(1);
  if (codeDup.length > 0) {
    throw new AppError("DUPLICATE_CODE", `Employee code "${data.employeeCode}" is already in use.`, 409);
  }

  const hash = await bcrypt.hash(data.password, 10);
  const [emp] = await db
    .insert(employees)
    .values({
      employeeCode: data.employeeCode,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: hash,
      role: "employee",
      status: "active",
      phone: data.phone ?? null,
      designation: data.designation ?? null,
    })
    .returning();

  return sanitise(emp);
}

/* ───────── login ───────── */

export async function login(email: string, password: string) {
  const [emp] = await db.select().from(employees).where(eq(employees.email, email)).limit(1);
  if (!emp) {
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }
  if (emp.status === "inactive" || emp.status === "suspended") {
    throw new AppError(
      "ACCOUNT_INACTIVE",
      "This account has been deactivated. Contact your Asset Manager or Admin.",
      403,
    );
  }

  const match = await bcrypt.compare(password, emp.password);
  if (!match) {
    throw new AppError("INVALID_CREDENTIALS", "Incorrect email or password.", 401);
  }

  const accessToken = signAccess(emp.id, emp.role);
  const refreshToken = signRefresh(emp.id);
  const refreshHash = crypto.createHash("sha256").update(refreshToken).digest("hex");

  await db.insert(refreshTokens).values({
    employeeId: emp.id,
    tokenHash: refreshHash,
    expiresAt: new Date(Date.now() + REFRESH_EXPIRY_MS),
  });

  return { user: sanitise(emp), accessToken, refreshToken };
}

/* ───────── refresh ───────── */

export async function refresh(rawToken: string) {
  let payload: { userId: number };
  try {
    payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as { userId: number };
  } catch {
    throw new AppError("INVALID_REFRESH_TOKEN", "Your session has expired. Please sign in again.", 401);
  }

  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)))
    .limit(1);

  if (!stored) {
    throw new AppError("INVALID_REFRESH_TOKEN", "Your session has expired. Please sign in again.", 401);
  }

  const [emp] = await db.select().from(employees).where(eq(employees.id, payload.userId)).limit(1);
  if (!emp || emp.status === "inactive" || emp.status === "suspended") {
    throw new AppError("ACCOUNT_INACTIVE", "This account is no longer active.", 403);
  }

  const accessToken = signAccess(emp.id, emp.role);
  return { user: sanitise(emp), accessToken };
}

/* ───────── logout ───────── */

export async function logout(rawToken: string) {
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.tokenHash, hash), isNull(refreshTokens.revokedAt)));
}

/* ───────── session ───────── */

export async function getSession(userId: number) {
  const [emp] = await db.select().from(employees).where(eq(employees.id, userId)).limit(1);
  if (!emp) throw new AppError("NOT_FOUND", "User not found.", 404);
  return sanitise(emp);
}

/* ───────── forgot-password ───────── */

export async function forgotPassword(email: string) {
  const [emp] = await db.select({ id: employees.id }).from(employees).where(eq(employees.email, email)).limit(1);
  if (!emp) return;

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(passwordResetOtps).values({
    employeeId: emp.id,
    otpHash,
    expiresAt,
  });

  await sendMail(email, "Your AssetFlow Password Reset Code", otpEmail(otp, env.OTP_EXPIRY_MINUTES));
}

/* ───────── verify-otp ───────── */

export async function verifyOtp(email: string, otp: string) {
  const [emp] = await db.select({ id: employees.id }).from(employees).where(eq(employees.email, email)).limit(1);
  if (!emp) {
    throw new AppError("INVALID_OR_EXPIRED_OTP", "That code is incorrect or has expired. Request a new one.", 400);
  }

  const [row] = await db
    .select()
    .from(passwordResetOtps)
    .where(
      and(
        eq(passwordResetOtps.employeeId, emp.id),
        isNull(passwordResetOtps.consumedAt),
        sql`${passwordResetOtps.expiresAt} > NOW()`,
      ),
    )
    .orderBy(desc(passwordResetOtps.createdAt))
    .limit(1);

  if (!row) {
    throw new AppError("INVALID_OR_EXPIRED_OTP", "That code is incorrect or has expired. Request a new one.", 400);
  }
  if (row.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError("TOO_MANY_ATTEMPTS", "Too many incorrect attempts. Please request a new code.", 429);
  }

  const valid = await bcrypt.compare(otp, row.otpHash);
  if (!valid) {
    await db
      .update(passwordResetOtps)
      .set({ attempts: row.attempts + 1 })
      .where(eq(passwordResetOtps.id, row.id));
    throw new AppError("INVALID_OR_EXPIRED_OTP", "That code is incorrect or has expired. Request a new one.", 400);
  }

  await db
    .update(passwordResetOtps)
    .set({ consumedAt: new Date() })
    .where(eq(passwordResetOtps.id, row.id));

  const resetToken = signResetToken(emp.id);
  return { resetToken };
}

/* ───────── reset-password ───────── */

export async function resetPassword(resetToken: string, newPassword: string) {
  let payload: { userId: number; purpose: string };
  try {
    payload = jwt.verify(resetToken, env.JWT_REFRESH_SECRET) as { userId: number; purpose: string };
  } catch {
    throw new AppError("INVALID_RESET_TOKEN", "This reset link has expired. Please start over.", 400);
  }
  if (payload.purpose !== "password-reset") {
    throw new AppError("INVALID_RESET_TOKEN", "This reset link has expired. Please start over.", 400);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await db.update(employees).set({ password: hash }).where(eq(employees.id, payload.userId));

  // Revoke all refresh tokens for this user
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.employeeId, payload.userId), isNull(refreshTokens.revokedAt)));
}
