import mongoose from "mongoose";
import { connectToDatabase } from "./db";
import Subscription from "./models/Subscription";
import { getPlan, PlanId } from "./plans";

export interface SubscriptionInfo {
  email: string;
  planId: PlanId;
  applicationsPerMonth: number;
  applicationsUsed: number;
  periodStart: Date;
  periodEnd: Date;
  active: boolean;
  remaining: number; // -1 = unlimited
}

export async function getOrCreateSubscription(email: string): Promise<SubscriptionInfo> {
  await connectToDatabase();
  const normalized = String(email || "").toLowerCase().trim();
  let sub = await Subscription.findOne({ email: normalized });

  const now = new Date();
  if (!sub) {
    sub = await Subscription.create({
      email: normalized,
      planId: "free",
      applicationsPerMonth: 1,
      applicationsUsed: 0,
      periodStart: now,
      periodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    });
  }

  // Roll over period if expired
  if (sub.periodEnd && new Date(sub.periodEnd).getTime() < now.getTime()) {
    sub.planId = "free";
    sub.applicationsPerMonth = 1;
    sub.applicationsUsed = 0;
    sub.periodStart = now;
    sub.periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    sub.updatedAt = now;
    await sub.save();
  }

  const plan = getPlan(sub.planId);
  const used = sub.applicationsUsed || 0;
  const limit = plan.applicationsPerMonth;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - used);

  return {
    email: normalized,
    planId: (sub.planId as PlanId) || "free",
    applicationsPerMonth: limit,
    applicationsUsed: used,
    periodStart: sub.periodStart,
    periodEnd: sub.periodEnd,
    active: true,
    remaining,
  };
}

export async function canApply(email: string): Promise<{
  allowed: boolean;
  reason?: string;
  subscription: SubscriptionInfo;
}> {
  const sub = await getOrCreateSubscription(email);
  if (sub.remaining === -1) return { allowed: true, subscription: sub };
  if (sub.remaining <= 0) {
    return {
      allowed: false,
      reason: "You have used all your internship applications for this plan period. Please upgrade your plan to apply for more internships.",
      subscription: sub,
    };
  }
  return { allowed: true, subscription: sub };
}

export async function consumeApplication(email: string): Promise<void> {
  await connectToDatabase();
  const normalized = String(email || "").toLowerCase().trim();
  await Subscription.updateOne(
    { email: normalized },
    { $inc: { applicationsUsed: 1 }, $set: { updatedAt: new Date() } }
  );
}

export async function activatePaidPlan(
  email: string,
  planId: PlanId,
  periodDays: number
): Promise<mongoose.Document> {
  return connectToDatabase().then(() => {
    const now = new Date();
    const plan = getPlan(planId);
    const end = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);
    const normalized = String(email || "").toLowerCase().trim();
    return Subscription.findOneAndUpdate(
      { email: normalized },
      {
        $set: {
          planId,
          applicationsPerMonth: plan.applicationsPerMonth,
          applicationsUsed: 0,
          periodStart: now,
          periodEnd: end,
          updatedAt: now,
        },
      },
      { upsert: true, new: true }
    );
  });
}
