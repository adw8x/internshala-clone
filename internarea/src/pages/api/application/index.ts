import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Application from "@/lib/models/Application";

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
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
