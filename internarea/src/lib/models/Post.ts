import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  content: { type: String, required: true, trim: true },
  media: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },
});

export default mongoose.models.Post || mongoose.model("Post", postSchema);
