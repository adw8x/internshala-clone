import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Payment from "@/lib/models/Payment";
import { getPlan, isPaymentWindowOpen, PlanId } from "@/lib/plans";
import { razorpayConfigured, getRazorpay } from "@/lib/razorpay";

const PAID_PLANS: PlanId[] = ["bronze", "silver", "gold"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, name, planId } = req.body || {};

  if (!email || !name) {
    return res.status(400).json({ error: "Email and name are required" });
  }
  if (!PAID_PLANS.includes(planId)) {
    return res.status(400).json({ error: "Invalid plan selected" });
  }

  // Enforce the strict payment window (10:00 - 11:00 AM IST)
  if (!isPaymentWindowOpen()) {
    return res.status(403).json({
      error: "Payments are only allowed between 10:00 AM and 11:00 AM IST. Please try again during that window.",
    });
  }

  if (!razorpayConfigured()) {
    return res.status(500).json({ error: "Payment gateway is not configured" });
  }

  const plan = getPlan(planId);

  try {
    await connectToDatabase();

    const razorpay = getRazorpay();
    const amount = plan.monthlyPriceINR * 100; // paise

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `plan_${planId}_${Date.now()}`,
      notes: { planId, planName: plan.name, email, name },
    });

    const payment = await Payment.create({
      email: String(email).toLowerCase().trim(),
      planId,
      planName: plan.name,
      amountINR: plan.monthlyPriceINR,
      razorpayOrderId: order.id,
      status: "created",
    });

    res.status(200).json({
      key: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount,
      currency: "INR",
      amountINR: plan.monthlyPriceINR,
      planId: plan.id,
      planName: plan.name,
      description: plan.description,
      name,
      email,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({ error: "Failed to create payment order" });
  }
}
