import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import { OtpRateLimitError } from "@/lib/otp";
import {
  createEmailOtp,
  RESUME_OTP_PURPOSE,
} from "@/lib/otp";
import { getOrCreateSubscription } from "@/lib/subscription";
import { isPremiumPlan } from "@/lib/resume";
import { sendEmail } from "@/lib/mailer";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body || {};
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  try {
    await connectToDatabase();

    const sub = await getOrCreateSubscription(String(email));
    if (!isPremiumPlan(sub.planId)) {
      return res.status(403).json({
        error: "Resume creation is available only on a premium plan. Please upgrade your plan first.",
      });
    }

    let code: string;
    try {
      code = await createEmailOtp(String(email), RESUME_OTP_PURPOSE);
    } catch (err) {
      if (err instanceof OtpRateLimitError) {
        return res.status(429).json({ error: err.message });
      }
      throw err;
    }

    const masked = code.slice(0, 2) + "*".repeat(code.length - 2);

    try {
      await sendEmail({
        to: String(email),
        subject: "Your Internshala Resume OTP",
        text: `Your OTP for creating a professional resume is: ${code}\nIt expires in 5 minutes. Do not share this with anyone.\n\n- Internshala Clone`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <div style="background:#2563eb;color:#fff;padding:20px 28px">
              <h1 style="margin:0;font-size:18px">Internshala Clone - Resume OTP</h1>
            </div>
            <div style="padding:24px 28px;text-align:center">
              <p style="color:#374151;font-size:14px">Use the OTP below to verify your email before paying for your resume. It expires in <strong>5 minutes</strong>.</p>
              <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#2563eb;margin:16px 0">${code}</div>
              <p style="color:#9ca3af;font-size:12px">Never share this OTP with anyone.</p>
            </div>
          </div>`,
      });
    } catch (mailErr) {
      console.error("Resume OTP email failure:", mailErr);
      return res.status(502).json({ error: "Could not send the OTP email. Please try again." });
    }

    res.status(200).json({
      sent: true,
      masked,
      message: "OTP sent. Check your email for the 6-digit code (valid 5 minutes).",
    });
  } catch (error) {
    console.error("Send resume OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}