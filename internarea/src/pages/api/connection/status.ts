import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Connection from "@/lib/models/Connection";
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
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();

  const authReq = req as AuthRequest;
  await runMiddleware(authReq, res, authMiddleware);

  try {
    const userId = authReq.user!.id;
    const targetUserId = authReq.query.userId as string;

    if (!targetUserId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const connection = await Connection.findOne({
      $or: [
        { sender: userId, receiver: targetUserId },
        { sender: targetUserId, receiver: userId },
      ],
    });

    if (!connection) {
      return res.status(200).json({ status: "none" });
    }

    let status = connection.status;
    if (status === "pending") {
      status =
        connection.sender.toString() === userId ? "sent" : "received";
    }

    res.status(200).json({ status, connectionId: connection._id });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(400).json({ error: "Failed to check status" });
  }
}
