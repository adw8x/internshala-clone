import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Internship from "@/lib/models/Internship";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectToDatabase();

  if (req.method === "GET") {
    try {
      const data = await Internship.find();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "internal server error" });
    }
  } else if (req.method === "POST") {
    try {
      const internship = new Internship({
        title: req.body.title,
        company: req.body.company,
        location: req.body.location,
        category: req.body.category,
        aboutCompany: req.body.aboutCompany,
        aboutInternship: req.body.aboutInternship,
        whoCanApply: req.body.whoCanApply,
        perks: req.body.perks,
        numberOfOpening: req.body.numberOfOpening,
        stipend: req.body.stipend,
        startDate: req.body.startDate,
        additionalInfo: req.body.additionalInfo,
      });
      const data = await internship.save();
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create internship" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
