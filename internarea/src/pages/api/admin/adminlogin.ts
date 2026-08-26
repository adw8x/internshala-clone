import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username, password } = req.body;

  // 1. Check env var credentials (legacy)
  const adminuser = process.env.ADMIN_USERNAME || "admin";
  const adminpass = process.env.ADMIN_PASSWORD || "admin";
  if (username === adminuser && password === adminpass) {
    return res.status(200).json({ user: { name: username, role: "admin" } });
  }

  // 2. Check Account model for admin accounts
  try {
    await connectToDatabase();
    const account = await Account.findOne({
      email: String(username).toLowerCase(),
      role: "admin",
    });

    if (!account || !account.passwordHash) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const valid = await bcrypt.compare(String(password), account.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    res.status(200).json({
      user: { email: account.email, name: account.name, role: account.role },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
