import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";
import LoginLog from "@/lib/models/LoginLog";
import { OtpInvalidError, verifyEmailOtp, LOGIN_OTP_PURPOSE } from "@/lib/otp";
import { environmentFromRequest, recordLoginAttempt } from "@/lib/loginLog";
import { isLoginWindowOpen } from "@/lib/loginWindow";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, code } = req.body || {};
  const normalized = String(email || "").toLowerCase().trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized)) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Please enter the 6-digit OTP" });
  }

  const env = environmentFromRequest(req);
  if (env.deviceType === "mobile" && !isLoginWindowOpen()) {
    await recordLoginAttempt(req, {
      email: normalized,
      status: "blocked",
      reason: "mobile-outside-window",
      env,
    });
    return res.status(403).json({
      error: "Mobile login is only allowed between 10:00 AM and 1:00 PM IST.",
    });
  }

  try {
    await connectToDatabase();
    try {
      await verifyEmailOtp(normalized, LOGIN_OTP_PURPOSE, String(code));
    } catch (err) {
      if (err instanceof OtpInvalidError) return res.status(400).json({ error: err.message });
      throw err;
    }

    // Only Chrome logins reach OTP verification; flip the pending attempt to success
    await LoginLog.updateOne(
      { email: normalized, status: "pending" },
      { $set: { status: "success", reason: "" } }
    );

    const account = await Account.findOne({ email: normalized });
    if (!account) {
      return res.status(404).json({ error: "Account not found" });
    }

    res.status(200).json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Verify login OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}