// Login window: only 10:00 AM - 1:00 PM IST
export const LOGIN_WINDOW = {
  hourStart: 10, // IST
  hourEnd: 13, // IST (exclusive)
  timezone: "Asia/Kolkata",
};

export function isLoginWindowOpen(now: Date = new Date()): boolean {
  const ist = new Intl.DateTimeFormat("en-GB", {
    timeZone: LOGIN_WINDOW.timezone,
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
  }).formatToParts(now);

  const hour = Number(ist.find((p) => p.type === "hour")?.value);
  return hour >= LOGIN_WINDOW.hourStart && hour < LOGIN_WINDOW.hourEnd;
}