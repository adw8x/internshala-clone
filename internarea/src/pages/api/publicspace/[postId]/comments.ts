import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Comment from "@/lib/models/Comment";
import Post from "@/lib/models/Post";
import { authMiddleware, AuthRequest } from "@/lib/serverAuth";

function runMiddleware(req: AuthRequest, res: NextApiResponse, fn: Function) {
  return new Promise<void>((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      resolve();
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { postId } = req.query;

  if (req.method === "GET") {
    try {
      const comments = await Comment.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate("author", "name photo")
        .lean();
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  } else if (req.method === "POST") {
    const authReq = req as AuthRequest;
    await runMiddleware(authReq, res, authMiddleware);

    try {
      const { content } = authReq.body;
      const userId = authReq.user!.id;

      const post = await Post.findById(postId);
      if (!post) return res.status(404).json({ error: "Post not found" });

      const comment = await Comment.create({
        content,
        post: postId,
        author: userId,
      });

      await comment.populate("author", "name photo");
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
