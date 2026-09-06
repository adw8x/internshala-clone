import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Resume from "@/lib/models/Resume";
import {
  hasRecentVerifiedOtp,
  RESUME_OTP_PURPOSE,
} from "@/lib/otp";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";
import { getOrCreateSubscription } from "@/lib/subscription";
import {
  isPremiumPlan,
  RESUME_FEE_INR,
  RESUME_FEE_PAISE,
} from "@/lib/resume";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    name,
    phone,
    address,
    summary,
    skills,
    education,
    experience,
    photo,
  } = req.body || {};

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: "A valid email is required" });
  }
  if (!name || !String(name).trim() || String(name).trim().length < 2) {
    return res.status(400).json({ error: "Please enter your full name" });
  }

  const skillList = Array.isArray(skills)
    ? skills.map((s: any) => String(s).trim()).filter(Boolean)
    : [];
  const educationList = Array.isArray(education)
    ? education.map((e: any) => ({
        degree: String(e?.degree || "").trim(),
        institution: String(e?.institution || "").trim(),
        year: String(e?.year || "").trim(),
        percentage: String(e?.percentage || "").trim(),
      }))
    : [];
  const experienceList = Array.isArray(experience)
    ? experience.map((x: any) => ({
        company: String(x?.company || "").trim(),
        role: String(x?.role || "").trim(),
        duration: String(x?.duration || "").trim(),
        description: String(x?.description || "").trim(),
      }))
    : [];

  const hasEducation = educationList.some((e) => e.degree || e.institution);
  if (!hasEducation) {
    return res.status(400).json({ error: "Please add at least one qualification" });
  }

  try {
    await connectToDatabase();

    const sub = await getOrCreateSubscription(String(email));
    if (!isPremiumPlan(sub.planId)) {
      return res.status(403).json({
        error: "Resume creation is available only on a premium plan. Please upgrade your plan first.",
      });
    }

    const verified = await hasRecentVerifiedOtp(
      String(email),
      RESUME_OTP_PURPOSE
    );
    if (!verified) {
      return res.status(400).json({
        error: "Please verify the OTP sent to your email before proceeding to payment.",
      });
    }

    if (!razorpayConfigured()) {
      return res.status(500).json({ error: "Payment gateway is not configured" });
    }

    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount: RESUME_FEE_PAISE,
      currency: "INR",
      receipt: `resume_${Date.now()}`,
      notes: { email: String(email), purpose: "resume" },
    });

    const resume = await Resume.create({
      email: String(email).toLowerCase().trim(),
      name: String(name).trim(),
      phone: String(phone || "").trim(),
      address: String(address || "").trim(),
      summary: String(summary || "").trim(),
      skills: skillList,
      education: educationList,
      experience: experienceList,
      photo: String(photo || ""),
      amountINR: RESUME_FEE_INR,
      razorpayOrderId: order.id,
      receipt: order.receipt,
      status: "awaiting_payment",
    });

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: RESUME_FEE_PAISE,
      currency: "INR",
      amountINR: RESUME_FEE_INR,
      resumeId: resume._id.toString(),
    });
  } catch (error) {
    console.error("Resume order creation error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
}