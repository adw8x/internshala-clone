import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import User from "@/lib/models/User";
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
    const currentUserId = authReq.user!.id;
    const search = (authReq.query.search as string) || "";

    const currentUser = await User.findById(currentUserId).select("email firebaseUid");
    const query: any = {
      _id: { $ne: currentUserId },
    };

    if (currentUser?.email) {
      query.email = { $ne: currentUser.email };
    }

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .select("name email photo createdAt")
      .limit(50)
      .sort({ createdAt: -1 });

    const userIds = users.map((u) => u._id);

    const connections = await Connection.find({
      $or: [
        { sender: { $in: userIds }, receiver: currentUserId },
        { sender: currentUserId, receiver: { $in: userIds } },
      ],
    });

    const connectionMap: Record<string, string> = {};
    connections.forEach((c) => {
      const otherId =
        c.sender.toString() === currentUserId
          ? c.receiver.toString()
          : c.sender.toString();

      if (c.status === "accepted") {
        connectionMap[otherId] = "connected";
      } else if (c.status === "pending") {
        if (c.sender.toString() === currentUserId) {
          connectionMap[otherId] = "sent";
        } else {
          connectionMap[otherId] = "received";
        }
      } else if (c.status === "rejected") {
        connectionMap[otherId] = "rejected";
      }
    });

    const usersWithStatus = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      photo: u.photo,
      connectionStatus: connectionMap[u._id.toString()] || "none",
    }));

    res.status(200).json({ users: usersWithStatus });
  } catch (error) {
    console.error("Discover users error:", error);
    res.status(400).json({ error: "Failed to fetch users" });
  }
}
