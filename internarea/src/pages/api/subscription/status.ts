import type { NextApiRequest, NextApiResponse } from "next";
import { getOrCreateSubscription } from "@/lib/subscription";
import { PLANS } from "@/lib/plans";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const email = req.query.email as string;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const sub = await getOrCreateSubscription(email);
    res.status(200).json({
      planId: sub.planId,
      applicationsPerMonth: sub.applicationsPerMonth,
      applicationsUsed: sub.applicationsUsed,
      remaining: sub.remaining,
      periodStart: sub.periodStart,
      periodEnd: sub.periodEnd,
      plans: Object.values(PLANS),
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    res.status(500).json({ error: "Failed to load subscription" });
  }
}
