import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    planId: { type: String, enum: ["bronze", "silver", "gold"], required: true },
    planName: String,
    amountINR: { type: Number, required: true },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    invoiceNumber: String,
    periodStart: Date,
    periodEnd: Date,
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
