import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Job from "@/lib/models/Job";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const data = await Job.find();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const job = new Job({
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        Experience: req.body.Experience,
        category: req.body.category,
        aboutCompany: req.body.aboutCompany,
        aboutJob: req.body.aboutJob,
        whoCanApply: req.body.whoCanApply,
        perks: req.body.perks,
        numberOfOpening: req.body.numberOfOpening,
        AdditionalInfo: req.body.AdditionalInfo,
        CTC: req.body.CTC,
        StartDate: req.body.StartDate || req.body.startDate,
      });
      const data = await job.save();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create job" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
