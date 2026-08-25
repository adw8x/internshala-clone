import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Share from "@/lib/models/Share";
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

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const share = new Share({ post: postId, user: userId });
    await share.save();
    await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });
    const updatedPost = await Post.findById(postId).select("sharesCount");
    res.status(201).json({ message: "Shared", sharesCount: updatedPost?.sharesCount });
  } catch (error) {
    res.status(400).json({ error: "Invalid request" });
  }
}
