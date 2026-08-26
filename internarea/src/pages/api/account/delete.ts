import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { authMiddleware, AuthRequest } from "@/lib/serverAuth";

async function handler(req: AuthRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const db = mongoose.connection.db!;
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const userEmail = req.user!.email.toLowerCase();
    const userName = req.user!.name;

    await db.collection("users").deleteOne({ _id: userId });
    await db.collection("accounts").deleteOne({ email: userEmail });
    await db.collection("connections").deleteMany({ $or: [{ sender: userId }, { receiver: userId }] });
    await db.collection("posts").deleteMany({ author: userId });
    await db.collection("comments").deleteMany({ author: userId });
    await db.collection("likes").deleteMany({ user: userId });
    await db.collection("shares").deleteMany({ user: userId });
    await db.collection("applications").deleteMany({ "user.name": userName });
    await db.collection("users").updateMany(
      { _id: { $ne: userId }, friends: userId },
      { $pull: { friends: userId } }
    );

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    res.status(500).json({ error: "Failed to delete account" });
  }
}

export default function (req: NextApiRequest, res: NextApiResponse) {
  return authMiddleware(req as AuthRequest, res, () => handler(req as AuthRequest, res));
}
