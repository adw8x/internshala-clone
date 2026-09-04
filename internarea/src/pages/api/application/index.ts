import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Application from "@/lib/models/Application";
import { canApply, consumeApplication } from "@/lib/subscription";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const data = await Application.find();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "internal server error" });
    }
  } else if (req.method === "POST") {
    const email = req.body?.user?.email as string | undefined;
    if (!email) {
      return res.status(401).json({ error: "Please sign in to apply" });
    }

    // Enforce subscription-based application limit
    const check = await canApply(email);
    if (!check.allowed) {
      return res.status(403).json({ error: check.reason });
    }

    try {
      const app = new Application({
        company: req.body.company,
        category: req.body.category,
        coverLetter: req.body.coverLetter,
        user: req.body.user,
        Application: req.body.Application,
        availability: req.body.availability,
      });
      const data = await app.save();
      // Consume one application after a successful save
      await consumeApplication(email);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
