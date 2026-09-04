import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Payment from "@/lib/models/Payment";
import { getPlan, PlanId } from "@/lib/plans";
import { activatePaidPlan } from "@/lib/subscription";
import { sendInvoiceEmail } from "@/lib/invoiceEmail";

const PAID_PLANS: PlanId[] = ["bronze", "silver", "gold"];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, email, name } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment details" });
  }
  if (!PAID_PLANS.includes(planId) || !email) {
    return res.status(400).json({ error: "Invalid payment request" });
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

    const plan = getPlan(planId);
    const normalizedEmail = String(email).toLowerCase().trim();

    // Mark payment as paid
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        $set: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "paid",
          invoiceNumber: `INV-${Date.now()}`,
          paidAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    // Activate the paid plan (period is plan.periodDays, renewed monthly)
    await activatePaidPlan(normalizedEmail, planId, plan.periodDays);

    // Send invoice email (best-effort; don't fail the flow if email fails)
    try {
      await sendInvoiceEmail({
        to: normalizedEmail,
        name: name || email,
        plan: plan,
        amountINR: plan.monthlyPriceINR,
        paymentId: razorpay_payment_id,
        invoiceNumber: payment.invoiceNumber || `INV-${Date.now()}`,
        periodStart: payment.periodStart || new Date(),
        periodEnd: payment.periodEnd || new Date(Date.now() + plan.periodDays * 24 * 60 * 60 * 1000),
      });
    } catch (emailErr) {
      console.error("Invoice email failure:", emailErr);
    }

    res.status(200).json({
      success: true,
      message: "Payment successful. Your plan has been activated.",
      planId: plan.id,
      planName: plan.name,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ error: "Payment verification failed" });
  }
}
