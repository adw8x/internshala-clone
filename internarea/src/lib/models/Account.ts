import mongoose from "mongoose";

const accountSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, sparse: true },
    name: { type: String, trim: true },
    passwordHash: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    provider: { type: String, enum: ["password", "google"], default: "password" },
    firebaseUid: String,
    photo: String,
    lastResetRequestAt: Date,
    resetTokenHash: String,
    resetTokenExpiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Account || mongoose.model("Account", accountSchema);
