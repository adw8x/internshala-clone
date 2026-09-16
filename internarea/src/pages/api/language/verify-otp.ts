import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import { OtpInvalidError, verifyEmailOtp } from "@/lib/otp";

const LANG_FR_PURPOSE = "lang-fr";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email, code } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!code || !/^\d{6}$/.test(String(code))) {
    return res.status(400).json({ error: "Please enter the 6-digit OTP" });
  }

  try {
    await connectToDatabase();
    try {
      await verifyEmailOtp(String(email), LANG_FR_PURPOSE, String(code));
    } catch (err) {
      if (err instanceof OtpInvalidError) return res.status(400).json({ error: err.message });
      throw err;
    }
    res.status(200).json({ verified: true, message: "Email verified successfully." });
  } catch (error) {
    console.error("Verify language OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}