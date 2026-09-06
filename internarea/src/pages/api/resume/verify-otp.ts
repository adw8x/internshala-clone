import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import { OtpInvalidError } from "@/lib/otp";
import { RESUME_OTP_PURPOSE, verifyEmailOtp } from "@/lib/otp";
import { getOrCreateSubscription } from "@/lib/subscription";
import { isPremiumPlan } from "@/lib/resume";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, code } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Please enter the 6-digit OTP" });
  }

  try {
    await connectToDatabase();

    const sub = await getOrCreateSubscription(String(email));
    if (!isPremiumPlan(sub.planId)) {
      return res.status(403).json({
        error: "Resume creation is available only on a premium plan. Please upgrade your plan first.",
      });
    }

    try {
      await verifyEmailOtp(String(email), RESUME_OTP_PURPOSE, String(code));
    } catch (err) {
      if (err instanceof OtpInvalidError) {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }

    res.status(200).json({
      verified: true,
      message: "Email verified successfully. You can now proceed to payment.",
    });
  } catch (error) {
    console.error("Verify resume OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}