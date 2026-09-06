import type { NextApiRequest, NextApiResponse } from "next";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Resume from "@/lib/models/Resume";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id || !mongoose.Types.ObjectId.isValid(String(id))) {
    return res.status(400).json({ error: "Invalid resume id" });
  }

  try {
    await connectToDatabase();

    const resume = await Resume.findById(String(id)).lean();
    if (!resume) {
      return res.status(404).json({ error: "Resume not found" });
    }

    res.status(200).json(resume);
  } catch (error) {
    console.error("Get resume error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}