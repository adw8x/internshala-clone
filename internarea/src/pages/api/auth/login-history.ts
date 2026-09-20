import type { NextApiRequest, NextApiResponse } from "next";
import { getLoginHistory } from "@/lib/loginLog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const raw = req.headers["x-user-email"];
  const email = decodeURIComponent(Array.isArray(raw) ? raw[0] : raw || "");
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const history = await getLoginHistory(email, limit);
    res.json({ history });
  } catch (error) {
    console.error("Login history error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}