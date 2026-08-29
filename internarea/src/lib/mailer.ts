import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const MAIL_FROM = process.env.MAIL_FROM || `Internshala Clone <${SMTP_USER}>`;
const SMS_GATEWAY_DOMAIN = (process.env.SMS_GATEWAY_DOMAIN || "").trim();

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
  }
  return transporter;
}

export function buildResetLink(token: string, origin?: string): string {
  const base = process.env.APP_URL || origin || "";
  return `${base}/reset-password?token=${token}`;
}

export function smsEnabled(): boolean {
  return Boolean(SMS_GATEWAY_DOMAIN);
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  await getTransporter().sendMail({ from: MAIL_FROM, ...opts });
}

export async function sendSmsViaGateway(phone: string, text: string): Promise<void> {
  if (!smsEnabled()) {
    throw new Error("SMS gateway is not configured");
  }
  const digits = String(phone).replace(/\D/g, "");
  const gatewayAddress = `${digits}@${SMS_GATEWAY_DOMAIN}`;
  await getTransporter().sendMail({ from: MAIL_FROM, to: gatewayAddress, subject: "", text });
}