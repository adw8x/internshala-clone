import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Application from "@/lib/models/Application";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const data = await Application.findById(id);
      if (!data) return res.status(404).json({ error: "application not found" });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "internal server error" });
    }
  } else if (req.method === "PUT") {
    const { action } = req.body;
    let status: string;
    if (action === "accepted") {
      status = "accepted";
    } else if (action === "rejected") {
      status = "rejected";
    } else {
      return res.status(400).json({ error: "Invalid action" });
    }
    try {
      const updated = await Application.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Not able to update the application" });
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ error: "internal server error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
