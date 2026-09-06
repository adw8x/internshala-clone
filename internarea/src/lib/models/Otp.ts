import mongoose from "mongoose";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    purpose: { type: String, required: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    used: { type: Boolean, default: false },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

otpSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.models.Otp || mongoose.model("Otp", otpSchema);