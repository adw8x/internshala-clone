import { NextApiResponse } from "next";
import { connectToDatabase } from "./db";
import Post from "./models/Post";
import User from "./models/User";
import { AuthRequest } from "./serverAuth";

export async function postingLimitMiddleware(
  req: AuthRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthenticated" });
    }

    await connectToDatabase();

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendCount = (user as any).friends?.length || 0;

    const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

    const postCount = await Post.countDocuments({
      author: userId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });

    let maxPosts: number;
    if (friendCount === 0) {
      return res.status(403).json({
        error:
          "You need at least 1 friend to post in Public Space. Add friends to unlock posting!",
      });
    } else if (friendCount === 1) {
      maxPosts = 1;
    } else if (friendCount === 2) {
      maxPosts = 2;
    } else if (friendCount >= 3 && friendCount <= 10) {
      maxPosts = friendCount;
    } else {
      maxPosts = 1000;
    }

    if (postCount >= maxPosts) {
      return res.status(429).json({
        error: `Daily posting limit exceeded (max ${maxPosts} posts per day)`,
      });
    }

    next();
  } catch (error) {
    console.error("Posting limit middleware error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
