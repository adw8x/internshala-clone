import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();
    const { username, email, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const existing = await Account.findOne({ email: String(email || username).toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const nameExists = await Account.findOne({ name: { $regex: `^${username}$`, $options: "i" } });
    if (nameExists) {
      return res.status(409).json({ error: "This username is already taken" });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const account = await Account.create({
      email: String(email || username).toLowerCase(),
      name: username,
      passwordHash,
      role: "admin",
      provider: "password",
    });

    res.status(201).json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
