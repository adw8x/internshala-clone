import crypto from "crypto";
import { connectToDatabase } from "./db";
import Otp from "./models/Otp";

export const RESUME_OTP_PURPOSE = "resume-otp";

export const OTP_TTL_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_VERIFIED_SESSION_MS = 10 * 60 * 1000;

export class OtpRateLimitError extends Error {}
export class OtpInvalidError extends Error {}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function generateOtpCode(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return crypto.randomInt(min, max + 1).toString();
}

export function normalizeEmail(email: string): string {
  return String(email || "").toLowerCase().trim();
}

/**
 * Creates an OTP record for a purpose. Throws OtpRateLimitError if a recent
 * unconsumed OTP exists for the same email within the resend cooldown.
 * Returns the plaintext code (caller sends it to the user).
 */
export async function createEmailOtp(
  email: string,
  purpose = RESUME_OTP_PURPOSE
): Promise<string> {
  await connectToDatabase();
  const normalized = normalizeEmail(email);

  const recent = await Otp.findOne({
    email: normalized,
    purpose,
    used: false,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 });

  if (
    recent &&
    recent.updatedAt &&
    Date.now() - new Date(recent.updatedAt).getTime() < OTP_RESEND_COOLDOWN_MS
  ) {
    throw new OtpRateLimitError("Please wait a minute before requesting another OTP.");
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const codeHash = hashCode(code);

  await Otp.create({ email: normalized, purpose, codeHash, expiresAt });

  return code;
}

/**
 * Verifies a submitted code. Throws OtpInvalidError with a user-friendly
 * message when the code is wrong, expired, or attempts are exhausted.
 * On success marks the OTP as used and records verifiedAt.
 */
export async function verifyEmailOtp(
  email: string,
  purpose: string,
  code: string
): Promise<boolean> {
  await connectToDatabase();
  const normalized = normalizeEmail(email);
  const submitted = String(code || "").trim();

  const otp = await Otp.findOne({
    email: normalized,
    purpose,
    used: false,
  }).sort({ createdAt: -1 });

  if (!otp) {
    throw new OtpInvalidError("No active OTP found. Please request a new one.");
  }

  if (new Date(otp.expiresAt).getTime() < Date.now()) {
    throw new OtpInvalidError("This OTP has expired. Please request a new one.");
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpInvalidError("Too many incorrect attempts. Please request a new OTP.");
  }

  if (hashCode(submitted) !== otp.codeHash) {
    otp.attempts = (otp.attempts || 0) + 1;
    await otp.save();
    throw new OtpInvalidError("Incorrect OTP. Please try again.");
  }

  otp.used = true;
  otp.verifiedAt = new Date();
  otp.attempts = (otp.attempts || 0) + 1;
  await otp.save();

  return true;
}

/**
 * Returns true if the email verified an OTP for this purpose within the last
 * `withinMs` (used to gate order creation after email verification).
 */
export async function hasRecentVerifiedOtp(
  email: string,
  purpose = RESUME_OTP_PURPOSE,
  withinMs = OTP_VERIFIED_SESSION_MS
): Promise<boolean> {
  await connectToDatabase();
  const normalized = normalizeEmail(email);
  const cutoff = new Date(Date.now() - withinMs);
  const otp = await Otp.findOne({
    email: normalized,
    purpose,
    used: true,
    verifiedAt: { $gte: cutoff },
  }).sort({ verifiedAt: -1 });
  return Boolean(otp);
}