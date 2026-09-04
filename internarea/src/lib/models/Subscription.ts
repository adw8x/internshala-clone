import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    planId: { type: String, enum: ["free", "bronze", "silver", "gold"], default: "free" },
    applicationsPerMonth: { type: Number, default: 1 }, // -1 = unlimited
    applicationsUsed: { type: Number, default: 0 },
    periodStart: { type: Date, default: Date.now },
    periodEnd: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
