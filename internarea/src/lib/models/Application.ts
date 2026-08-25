import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  company: String,
  category: String,
  coverLetter: String,
  user: Object,
  createdAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["accepted", "pending", "rejected"],
    default: "pending",
  },
  availability: String,
  Application: Object,
});

export default mongoose.models.Application || mongoose.model("Application", applicationSchema);
