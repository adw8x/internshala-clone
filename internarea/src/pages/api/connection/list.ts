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
    const type = (authReq.query.type as string) || "all";

    let filter: any = {};

    if (type === "connections") {
      filter = {
        status: "accepted",
        $or: [{ sender: userId }, { receiver: userId }],
      };
    } else if (type === "pending") {
      filter = { status: "pending", receiver: userId };
    } else if (type === "sent") {
      filter = { status: "pending", sender: userId };
    } else {
      filter = { $or: [{ sender: userId }, { receiver: userId }] };
    }

    const connections = await Connection.find(filter)
      .populate("sender", "name email photo")
      .populate("receiver", "name email photo")
      .sort({ updatedAt: -1 });

    res.status(200).json({ connections });
  } catch (error) {
    console.error("List connections error:", error);
    res.status(400).json({ error: "Failed to fetch connections" });
  }
}
