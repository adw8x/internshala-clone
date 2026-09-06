import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true },
    phone: String,
    address: String,
    summary: String,
    skills: [{ type: String }],
    education: [
      {
        degree: String,
        institution: String,
        year: String,
        percentage: String,
      },
    ],
    experience: [
      {
        company: String,
        role: String,
        duration: String,
        description: String,
      },
    ],
    photo: String,
    amountINR: { type: Number, default: 50 },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    receipt: String,
    status: {
      type: String,
      enum: ["awaiting_payment", "paid", "failed"],
      default: "awaiting_payment",
    },
    generatedHtml: String,
    paidAt: Date,
  },
  { timestamps: true }
);

resumeSchema.index({ email: 1, createdAt: -1 });
resumeSchema.index({ razorpayOrderId: 1 });

export default mongoose.models.Resume || mongoose.model("Resume", resumeSchema);