import type { NextApiRequest, NextApiResponse } from "next";
import { getRazorpay, razorpayConfigured } from "@/lib/razorpay";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { razorpay_order_id, razorpay_payment_id } = req.body || {};

  if (!razorpay_order_id) {
    return res.status(400).json({ error: "Razorpay order id is required" });
  }

  if (!razorpayConfigured()) {
    return res.status(500).json({ error: "Payment gateway is not configured" });
  }

  try {
    const razorpay = getRazorpay();

    const order = await razorpay.orders.fetch(razorpay_order_id);

    let payments: any[] = [];
    try {
      const { items } = await razorpay.orders.fetchPayments(razorpay_order_id);
      payments = items;
    } catch {
      payments = [];
    }

    const payment = payments.find((p: any) =>
      razorpay_payment_id ? p.id === razorpay_payment_id : true
    );

    const paid =
      order.status === "paid" || Number(order.amount_paid) > 0;

    res.status(200).json({
      verified: paid,
      orderId: order.id,
      orderStatus: order.status,
      amountINR: Number(order.amount) / 100,
      amountPaidINR: Number(order.amount_paid || 0) / 100,
      currency: order.currency,
      receipt: order.receipt || null,
      paidAt: payment?.captured_at || null,
      payment: payment
        ? {
            id: payment.id,
            status: payment.status,
            method: payment.method,
            amountINR: Number(payment.amount || 0) / 100,
            vpa: payment.vpa || null,
            card: payment.card ? { network: payment.card.network, last4: payment.card.last4 } : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Razorpay order verification error:", error);
    res.status(404).json({ error: "Order not found or could not be verified" });
  }
}