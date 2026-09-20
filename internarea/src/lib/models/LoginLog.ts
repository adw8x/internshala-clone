import mongoose from "mongoose";

const loginLogSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    browser: { type: String, default: "other" },
    os: { type: String, default: "other" },
    deviceType: { type: String, enum: ["mobile", "tablet", "computer"], default: "computer" },
    ip: { type: String, default: "" },
    status: { type: String, enum: ["success", "blocked", "pending", "failed"], required: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

loginLogSchema.index({ email: 1, createdAt: -1 });

export default mongoose.models.LoginLog || mongoose.model("LoginLog", loginLogSchema);