import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  await connectToDatabase();
  const { id } = req.query;

  try {
    const data = await Job.findById(id);
    if (!data) return res.status(404).json({ error: "Jobs not found" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "internal server error" });
  }
}
