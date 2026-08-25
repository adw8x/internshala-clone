import type { NextApiRequest, NextApiResponse } from "next";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const { email, name, photo, firebaseUid } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    let account = await Account.findOne({ email: String(email).toLowerCase() });
    let created = false;

    if (!account) {
      account = await Account.create({
        email: String(email).toLowerCase(),
        name: name || String(email).split("@")[0],
        photo,
        firebaseUid,
        role: "user",
        provider: "google",
      });
      created = true;
    } else {
      account.name = name || account.name;
      account.photo = photo || account.photo;
      account.firebaseUid = firebaseUid;
      account.provider = "google";
      await account.save();
    }

    res.json({
      user: {
        email: account.email,
        name: account.name,
        role: account.role,
        created,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
