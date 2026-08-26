import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Connection from "@/lib/models/Connection";
import User from "@/lib/models/User";
import { authMiddleware, AuthRequest } from "@/lib/serverAuth";

function runMiddleware(req: AuthRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();

  const authReq = req as AuthRequest;
  await runMiddleware(authReq, res, authMiddleware);

  try {
    const senderId = authReq.user!.id;
    const { receiverId } = authReq.body;

    if (!receiverId) {
      return res.status(400).json({ error: "Receiver ID is required" });
    }

    if (senderId === receiverId) {
      return res.status(400).json({ error: "Cannot connect with yourself" });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const existing = await Connection.findOne({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return res.status(400).json({ error: "Already connected" });
      }
      if (existing.status === "pending") {
        return res.status(400).json({ error: "Connection request already pending" });
      }
      if (existing.status === "rejected") {
        existing.status = "pending";
        existing.sender = senderId;
        existing.receiver = receiverId;
        await existing.save();
        return res.status(200).json({ message: "Request sent again" });
      }
    }

    const connection = await Connection.create({
      sender: senderId,
      receiver: receiverId,
      status: "pending",
    });

    res.status(201).json({ message: "Connection request sent", connection });
  } catch (error) {
    console.error("Send connection error:", error);
    res.status(400).json({ error: "Failed to send request" });
  }
}
