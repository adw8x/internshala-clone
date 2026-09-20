import type { NextApiRequest } from "next";
import { connectToDatabase } from "./db";
import LoginLog from "./models/LoginLog";
import { parseUserAgent, ClientEnv } from "./device";

export interface LoginAttemptInfo {
  email: string;
  status: "success" | "blocked" | "pending" | "failed";
  reason?: string;
  env?: ClientEnv;
  ip?: string;
}

function clientIp(req: NextApiRequest): string {
  const fwd = req.headers["x-forwarded-for"];
  const first = Array.isArray(fwd) ? fwd[0] : fwd;
  if (first) return String(first).split(",")[0].trim();
  const socket = (req as any).socket;
  if (socket?.remoteAddress) return String(socket.remoteAddress);
  return "";
}

export function environmentFromRequest(req: NextApiRequest): ClientEnv {
  const ua = Array.isArray(req.headers["x-user-agent"])
    ? req.headers["x-user-agent"][0]
    : req.headers["x-user-agent"];
  return parseUserAgent(ua);
}

export async function recordLoginAttempt(req: NextApiRequest, info: LoginAttemptInfo): Promise<void> {
  try {
    await connectToDatabase();
    const env = info.env || environmentFromRequest(req);
    await LoginLog.create({
      email: String(info.email).toLowerCase().trim(),
      browser: env.browser,
      os: env.os,
      deviceType: env.deviceType,
      ip: info.ip || clientIp(req),
      status: info.status,
      reason: info.reason || "",
    });
  } catch (err) {
    console.error("Failed to record login attempt:", err);
  }
}

export async function getLoginHistory(email: string, limit = 50) {
  await connectToDatabase();
  return LoginLog.find({ email: String(email).toLowerCase().trim() })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}