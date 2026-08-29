import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { connectToDatabase } from "@/lib/db";
import Account from "@/lib/models/Account";
import {
  buildResetLink,
  sendEmail,
  sendSmsViaGateway,
  smsEnabled,
} from "@/lib/mailer";

const DAY_MS = 24 * 60 * 60 * 1000;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await connectToDatabase();

    const { identifier, delivery } = req.body;
    if (!identifier) {
      return res.status(400).json({ error: "Email or phone number is required" });
    }
    if (delivery !== "email" && delivery !== "phone") {
      return res.status(400).json({ error: "Invalid delivery option" });
    }

    const id = String(identifier).trim();
    const isEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(id);
    const query = isEmail ? { email: id.toLowerCase() } : { phone: id };

    const account = await Account.findOne(query);

    if (
      account &&
      account.lastResetRequestAt &&
      Date.now() - new Date(account.lastResetRequestAt).getTime() < DAY_MS
    ) {
      return res.status(429).json({ error: "You can use this option only once per day." });
    }

    if (account) {
      account.lastResetRequestAt = new Date();
      await account.save();
    }

    let contact: string | null = null;
    if (account) {
      contact = delivery === "email" ? account.email || null : account.phone || null;
    }

    if (!account || !contact) {
      return res.json({ message: "If that matches a registered account, a reset link will be sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    account.resetTokenHash = tokenHash;
    account.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await account.save();

    const origin = req.headers.origin || req.headers.referer || process.env.APP_URL || "";
    const link = buildResetLink(token, origin);
    const name = account.name || "there";
    const text =
      `Hi ${name},\n\n` +
      `We received a request to reset your Internshala password. ` +
      `Use the link below to set a new password (valid for 60 minutes):\n\n${link}\n\n` +
      `If you didn't request this, you can safely ignore this message.\n\n- Internshala Clone`;

    const isPhone = delivery === "phone";
    let deliveryFailed = false;

    try {
      if (isPhone) {
        if (!smsEnabled()) throw new Error("SMS gateway is not configured");
        await sendSmsViaGateway(contact, `Reset your Internshala password here (valid 60 min): ${link}`);
      } else {
        await sendEmail({ to: contact, subject: "Reset your Internshala password", text });
      }
    } catch (error) {
      console.error("Failed to send reset link:", error);
      deliveryFailed = true;
    }

    res.json({
      message: deliveryFailed
        ? isPhone
          ? "SMS is not available right now. Use the link below to reset your password."
          : "Could not email the link. Use the link below to reset your password."
        : isPhone
        ? "Reset link sent to your phone number."
        : "Reset link sent to your email.",
      link: deliveryFailed ? link : undefined,
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}