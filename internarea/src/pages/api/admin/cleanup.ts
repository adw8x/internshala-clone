import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const db = (await import("mongoose")).default.connection.db;

    const accounts = await db!.collection("accounts").find({}).toArray();
    const seen = new Map<string, any>();
    const toDelete: any[] = [];

    for (const acc of accounts) {
      const lowerName = (acc.name || "").toLowerCase().trim();
      if (!lowerName) continue;
      if (seen.has(lowerName)) {
        toDelete.push(acc._id);
      } else {
        seen.set(lowerName, acc);
      }
    }

    let deletedCount = 0;
    if (toDelete.length > 0) {
      const result = await db!.collection("accounts").deleteMany({ _id: { $in: toDelete } });
      deletedCount = result.deletedCount;
    }

    res.status(200).json({
      total: accounts.length,
      duplicatesFound: toDelete.length,
      deleted: deletedCount,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    res.status(500).json({ error: "Cleanup failed" });
  }
}
