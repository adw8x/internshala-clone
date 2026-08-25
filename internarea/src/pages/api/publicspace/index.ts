import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Post from "@/lib/models/Post";
import { authMiddleware, AuthRequest } from "@/lib/serverAuth";
import { postingLimitMiddleware } from "@/lib/postingLimit";

function runMiddleware(req: AuthRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const posts = await Post.find()
        .sort({ createdAt: -1 })
        .populate("author", "name photo")
        .lean();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  } else if (req.method === "POST") {
    const authReq = req as AuthRequest;
    await runMiddleware(authReq, res, authMiddleware);
    await runMiddleware(authReq, res, postingLimitMiddleware);

    try {
      const { content, media } = authReq.body;
      const userId = authReq.user!.id;

      const post = new Post({ content, media, author: userId });
      await post.save();
      await post.populate("author", "name photo");
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
