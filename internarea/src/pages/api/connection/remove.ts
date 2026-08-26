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
    const userId = authReq.user!.id;
    const { connectionId } = authReq.body;

    if (!connectionId) {
      return res.status(400).json({ error: "Connection ID is required" });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: "Connection not found" });
    }

    const isParticipant =
      connection.sender.toString() === userId ||
      connection.receiver.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ error: "Not authorized" });
    }

    if (connection.status === "accepted") {
      await User.findByIdAndUpdate(connection.sender, {
        $pull: { friends: connection.receiver },
      });
      await User.findByIdAndUpdate(connection.receiver, {
        $pull: { friends: connection.sender },
      });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.status(200).json({ message: "Connection removed" });
  } catch (error) {
    console.error("Remove connection error:", error);
    res.status(400).json({ error: "Failed to remove connection" });
  }
}
