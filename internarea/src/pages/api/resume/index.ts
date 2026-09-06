import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Resume from "@/lib/models/Resume";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.query;
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  try {
    await connectToDatabase();

    const resumes = await Resume.find({
      email: String(email).toLowerCase().trim(),
    })
      .select("-generatedHtml")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ count: resumes.length, resumes });
  } catch (error) {
    console.error("List resumes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}