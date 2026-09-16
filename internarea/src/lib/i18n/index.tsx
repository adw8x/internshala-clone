import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const LANGS = [
  { code: "en" as const, label: "English" },
  { code: "es" as const, label: "Español" },
  { code: "hi" as const, label: "हिन्दी" },
  { code: "pt" as const, label: "Português" },
  { code: "zh" as const, label: "中文" },
  { code: "fr" as const, label: "Français" },
];

export type LangCode = (typeof LANGS)[number]["code"];

const dictModules: Record<LangCode, () => Promise<{ default: Record<string, any> }>> = {
  en: () => import("./locales/en.json"),
  es: () => import("./locales/es.json"),
  hi: () => import("./locales/hi.json"),
  pt: () => import("./locales/pt.json"),
  zh: () => import("./locales/zh.json"),
  fr: () => import("./locales/fr.json"),
};

const FR_SESSION_KEY = "i18n.frVerified";

function getNestedVal(obj: Record<string, any>, path: string): string | undefined {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = cur[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

interface LangCtx {
  lang: LangCode;
  setLang: (c: LangCode) => void;
  t: (key: string, vars?: Record<string, any>) => string;
  pendingLang: LangCode | null;
  setPendingLang: (c: LangCode | null) => void;
}

const Ctx = createContext<LangCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  pendingLang: null,
  setPendingLang: () => {},
});

export function useLanguage() {
  return useContext(Ctx);
}

function applyHtmlAttr(c: LangCode) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = c;
  }
}

export function isFrSessionVerified(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  return sessionStorage.getItem(FR_SESSION_KEY) === "1";
}

export function markFrSessionVerified() {
  sessionStorage.setItem(FR_SESSION_KEY, "1");
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [dicts, setDicts] = useState<Record<string, any>>({});
  const [pendingLang, setPendingLang] = useState<LangCode | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("app.lang") as LangCode | null;
    if (saved && LANGS.some((l) => l.code === saved)) {
      setLangState(saved);
      applyHtmlAttr(saved);
    }
  }, []);

  useEffect(() => {
    async function load() {
      const loaded: Record<string, any> = {};
      await Promise.all(
        LANGS.map(async (l) => {
          try {
            const mod = await dictModules[l.code]();
            loaded[l.code] = mod.default;
          } catch {
            loaded[l.code] = {};
          }
        })
      );
      setDicts(loaded);
    }
    load();
  }, []);

  const setLang = useCallback(
    (c: LangCode) => {
      setLangState(c);
      localStorage.setItem("app.lang", c);
      applyHtmlAttr(c);
    },
    []
  );

  const t = useCallback(
    (key: string, vars?: Record<string, any>) => {
      const activeDict = dicts[lang] || {};
      const enDict = dicts["en"] || {};
      let val = getNestedVal(activeDict, key) ?? getNestedVal(enDict, key) ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          val = val.replaceAll(`{${k}}`, String(v));
        }
      }
      return val;
    },
    [lang, dicts]
  );

  return (
    <Ctx.Provider value={{ lang, setLang, t, pendingLang, setPendingLang }}>
      {children}
    </Ctx.Provider>
  );
}