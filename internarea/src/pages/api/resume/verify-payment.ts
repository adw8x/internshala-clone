import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Resume from "@/lib/models/Resume";
import { generateResumeHtml } from "@/lib/resume";
import { sendEmail } from "@/lib/mailer";

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    resumeId,
    email,
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }
  if (!resumeId || !isValidObjectId(resumeId) || !email) {
    return res.status(400).json({ error: "Invalid resume or email" });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({ error: "Payment gateway is not configured" });
  }

  // Verify the Razorpay signature
  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed" });
  }

  try {
    await connectToDatabase();

    const normalizedEmail = String(email).toLowerCase().trim();

    const resume = await Resume.findOne({
      _id: resumeId,
      email: normalizedEmail,
      razorpayOrderId: razorpay_order_id,
    });

    if (!resume) {
      return res.status(404).json({ error: "Resume not found for this payment" });
    }

    if (resume.status === "paid") {
      return res.status(200).json({
        success: true,
        message: "Resume has already been generated.",
        resumeId: resume._id.toString(),
      });
    }

    const generatedHtml = generateResumeHtml({
      name: resume.name,
      email: resume.email,
      phone: resume.phone,
      address: resume.address,
      summary: resume.summary,
      skills: resume.skills,
      education: resume.education,
      experience: resume.experience,
      photo: resume.photo,
    });

    resume.status = "paid";
    resume.razorpayPaymentId = razorpay_payment_id;
    resume.razorpaySignature = razorpay_signature;
    resume.generatedHtml = generatedHtml;
    resume.paidAt = new Date();
    await resume.save();

    // Confirmation email (best-effort)
    const origin = process.env.APP_URL || "";
    const viewUrl = `${origin}/resume/${resume._id.toString()}`;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your Resume is Ready - Internshala Clone",
        text: `Hi ${resume.name},\n\nYour professional resume has been generated and attached to your profile for future internship applications.\n\nView it here: ${viewUrl}\n\n- Internshala Clone`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
            <div style="background:#2563eb;color:#fff;padding:22px 30px">
              <h1 style="margin:0;font-size:18px">Internshala Clone - Resume Ready</h1>
            </div>
            <div style="padding:24px 30px;color:#374151">
              <p>Hi ${resume.name},</p>
              <p>Your professional resume has been generated successfully and attached to your profile. It will be automatically included with your future internship applications.</p>
              <div style="margin:18px 0;text-align:center">
                <a href="${viewUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600">View My Resume</a>
              </div>
              <p style="color:#9ca3af;font-size:12px">Amount paid: Rs. ${resume.amountINR} · Payment ID: ${resume.razorpayPaymentId}</p>
            </div>
          </div>`,
      });
    } catch (mailErr) {
      console.error("Resume confirmation email failure:", mailErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment successful. Your professional resume has been generated.",
      resumeId: resume._id.toString(),
    });
  } catch (error) {
    console.error("Resume payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
}