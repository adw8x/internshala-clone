import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Like from "@/lib/models/Like";
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
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();

  const authReq = req as AuthRequest;
  await runMiddleware(authReq, res, authMiddleware);

  try {
    const { postId } = authReq.query;
    const userId = authReq.user!.id;

    const existingLike = await Like.findOne({ post: postId, user: userId });
    if (existingLike) {
      await Like.deleteOne({ _id: existingLike._id });
      await Post.findByIdAndUpdate(postId, { $inc: { likesCount: -1 } });
      const post = await Post.findById(postId).select("likesCount");
      return res.status(200).json({ message: "Unliked", likesCount: post?.likesCount });
    }

    const like = new Like({ post: postId, user: userId });
    await like.save();
    await Post.findByIdAndUpdate(postId, { $inc: { likesCount: 1 } });
    const post = await Post.findById(postId).select("likesCount");
    res.status(201).json({ message: "Liked", likesCount: post?.likesCount });
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
}
