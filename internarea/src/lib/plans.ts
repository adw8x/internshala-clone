export type PlanId = "free" | "bronze" | "silver" | "gold";

export interface Plan {
  id: PlanId;
  name: string;
  monthlyPriceINR: number;
  applicationsPerMonth: number; // -1 = unlimited
  description: string;
  periodDays: number;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceINR: 0,
    applicationsPerMonth: 1,
    description: "Apply for 1 internship per month",
    periodDays: 30,
  },
  bronze: {
    id: "bronze",
    name: "Bronze",
    monthlyPriceINR: 100,
    applicationsPerMonth: 3,
    description: "Apply for 3 internships per month",
    periodDays: 30,
  },
  silver: {
    id: "silver",
    name: "Silver",
    monthlyPriceINR: 300,
    applicationsPerMonth: 5,
    description: "Apply for 5 internships per month",
    periodDays: 30,
  },
  gold: {
    id: "gold",
    name: "Gold",
    monthlyPriceINR: 1000,
    applicationsPerMonth: -1,
    description: "Unlimited internship applications",
    periodDays: 30,
  },
};

export const PLAN_LIST: Plan[] = [PLANS.free, PLANS.bronze, PLANS.silver, PLANS.gold];

export function getPlan(id: string | null | undefined): Plan {
  return PLANS[(id as PlanId) || "free"] || PLANS.free;
}

// Payment window: only 10:00 - 11:00 AM IST
export const PAYMENT_WINDOW = {
  hourStart: 10, // IST
  hourEnd: 11, // IST (exclusive)
  timezone: "Asia/Kolkata",
};

export function isPaymentWindowOpen(now: Date = new Date()): boolean {
  const ist = new Intl.DateTimeFormat("en-GB", {
    timeZone: PAYMENT_WINDOW.timezone,
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).formatToParts(now);

  const hour = Number(ist.find((p) => p.type === "hour")?.value);
  return hour >= PAYMENT_WINDOW.hourStart && hour < PAYMENT_WINDOW.hourEnd;
}
