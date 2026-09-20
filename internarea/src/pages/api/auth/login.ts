import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";
import { recordLoginAttempt, environmentFromRequest } from "@/lib/loginLog";
import { isLoginWindowOpen } from "@/lib/loginWindow";
import { isChrome } from "@/lib/device";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const { email, password } = req.body;
    const normalized = String(email || "").toLowerCase().trim();

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const env = environmentFromRequest(req);

    // Mobile access is allowed only within the 10 AM - 1 PM IST window
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

    const account = await Account.findOne({ email: normalized });
    if (!account || !account.passwordHash) {
      await recordLoginAttempt(req, { email: normalized, status: "failed", reason: "invalid-credentials", env });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(String(password), account.passwordHash);
    if (!valid) {
      await recordLoginAttempt(req, { email: normalized, status: "failed", reason: "invalid-credentials", env });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const ua = Array.isArray(req.headers["x-user-agent"]) ? req.headers["x-user-agent"][0] : req.headers["x-user-agent"];
    const chrome = isChrome(String(ua || ""));

    // Chrome sign-ins are granted only after email OTP verification
    if (chrome) {
      await recordLoginAttempt(req, { email: normalized, status: "pending", reason: "chrome-otp-required", env });
      return res.status(200).json({ otpRequired: true, email: normalized });
    }

    await recordLoginAttempt(req, { email: normalized, status: "success", env });
    res.json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}