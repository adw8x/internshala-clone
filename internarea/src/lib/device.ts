export interface ClientEnv {
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "computer";
}

export function isChrome(ua: string): boolean {
  return /Chrome\/[\d.]+/.test(ua) && !/Edg[A]?\/|OPR\/|SamsungBrowser\/|MiuiBrowser\/|Crosswalk\/|wv/.test(ua);
}

export function parseUserAgent(ua?: string | null): ClientEnv {
  const raw = String(ua || "");

  let browser = "other";
  if (isChrome(raw)) browser = "chrome";
  else if (/Edg[A]?\/[\d.]+/.test(raw)) browser = "edge";
  else if (/OPR\/[\d.]+|Opera/.test(raw)) browser = "opera";
  else if (/Firefox\/[\d.]+/.test(raw)) browser = "firefox";
  else if (/MSIE |Trident\/|rv:11/.test(raw)) browser = "ie";
  else if (/Safari\/[\d.]+/.test(raw)) browser = "safari";

  let os = "other";
  if (/iPhone|iPad|iPod/i.test(raw)) os = "ios";
  else if (/Windows NT/.test(raw)) os = "windows";
  else if (/Mac OS X|Macintosh/.test(raw)) os = "macos";
  else if (/Android/.test(raw)) os = "android";
  else if (/Linux|X11/.test(raw)) os = "linux";

  let deviceType: ClientEnv["deviceType"] = "computer";
  if (/iPad|Tablet/.test(raw) || (/Android/.test(raw) && !/Mobile/.test(raw))) {
    deviceType = "tablet";
  } else if (/Mobile|iPhone|iPod/.test(raw)) {
    deviceType = "mobile";
  }

  return { browser, os, deviceType };
}