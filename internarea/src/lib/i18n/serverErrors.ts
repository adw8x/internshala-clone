import en from "./locales/en.json";
import es from "./locales/es.json";
import hi from "./locales/hi.json";
import pt from "./locales/pt.json";
import zh from "./locales/zh.json";
import fr from "./locales/fr.json";

const DICTS: Record<string, any> = { en, es, hi, pt, zh, fr };

const KNOWN_EN: Record<string, string> = {
  "Payments are only allowed between 10:00 AM and 11:00 AM IST. Please try again during that window.": "serverErrors.paymentWindow",
  "You have used all your internship applications for this plan period. Please upgrade your plan to apply for more internships.": "serverErrors.appLimitReached",
  "Resume creation is available only on a premium plan. Please upgrade your plan first.": "serverErrors.premiumRequired",
  "Please verify the OTP sent to your email before proceeding to payment.": "serverErrors.otpNotVerified",
  "Could not send the OTP email. Please try again.": "serverErrors.otpSendFailed",
  "Payment verification failed": "serverErrors.paymentVerifyFailed",
  "Payment verification failed.": "serverErrors.paymentVerifyFailed",
  "Invalid admin credentials": "serverErrors.invalidCredentials",
  "Invalid credentials": "serverErrors.invalidCredentials",
  "Please fill in all details": "serverErrors.fillAllDetails",
  "Method not allowed": "serverErrors.methodNotAllowed",
  "Internal server error": "serverErrors.internalError",
};

function pick(dict: any, path: string): string | undefined {
  const parts = path.split(".");
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

function currentLang(): string {
  if (typeof localStorage === "undefined") return "en";
  const saved = localStorage.getItem("app.lang");
  return saved && DICTS[saved] ? saved : "en";
}

export function localizeServerError(msg: string | undefined | null): string | null {
  if (!msg) return null;
  const key = KNOWN_EN[String(msg)];
  if (!key) return null;
  const lang = currentLang();
  return pick(DICTS[lang], key) ?? pick(DICTS["en"], key) ?? msg;
}