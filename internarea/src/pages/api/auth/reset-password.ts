import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function isTokenValid(account: any): boolean {
  return (
    !!account &&
    !!account.resetTokenHash &&
    !!account.resetTokenExpiresAt &&
    new Date(account.resetTokenExpiresAt).getTime() > Date.now()
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      await connectToDatabase();
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, error: "This reset link is invalid or has expired." });
      }

      const account = await Account.findOne({ resetTokenHash: hashToken(token) });
      if (!isTokenValid(account)) {
        return res.status(400).json({ valid: false, error: "This reset link is invalid or has expired." });
      }

      return res.json({ valid: true, name: account.name || undefined });
    } catch (error) {
      console.error("Reset token validation error:", error);
      return res.status(500).json({ valid: false, error: "Internal server error" });
    }
  }

  if (req.method === "POST") {
    try {
      await connectToDatabase();
      const { token, password } = req.body;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ error: "This reset link is invalid or has expired." });
      }
      if (!password || String(password).length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const account = await Account.findOne({ resetTokenHash: hashToken(token) });
      if (!isTokenValid(account)) {
        return res.status(400).json({ error: "This reset link is invalid or has expired." });
      }

      account.passwordHash = await bcrypt.hash(String(password), 10);
      account.resetTokenHash = undefined;
      account.resetTokenExpiresAt = undefined;
      await account.save();

      return res.json({ message: "Password updated successfully. You can now sign in." });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}