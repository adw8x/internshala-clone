import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const { name, email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await Account.findOne({ email: String(email).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const displayName = name || String(email).split("@")[0];
    const nameExists = await Account.findOne({ name: { $regex: `^${displayName}$`, $options: "i" } });
    if (nameExists) {
      return res.status(409).json({ error: "This username is already taken" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const account = await Account.create({
      email: String(email).toLowerCase(),
      name: name || String(email).split("@")[0],
      passwordHash,
      role: role === "admin" ? "admin" : "user",
      provider: "password",
    });

    res.status(201).json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
