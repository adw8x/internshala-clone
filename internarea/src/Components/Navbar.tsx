import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { auth } from "../firebase/firebase";
import { Search } from "lucide-react";
import { signOut } from "firebase/auth";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import { logout } from "@/Feature/Userslice";
import { setAdmin, clearAdmin } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleLogin";
import api from "@/lib/api";
import { useLanguage, LANGS, LangCode, isFrSessionVerified, markFrSessionVerified } from "@/lib/i18n";

interface SearchItem {
  type: "internship" | "job";
  _id: string;
  title: string;
  company: string;
  location: string;
}

const Navbar = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [frModalOpen, setFrModalOpen] = useState(false);
  const [frEmail, setFrEmail] = useState("");
  const [frCode, setFrCode] = useState("");
  const [frStep, setFrStep] = useState<"email" | "otp">("email");
  const [frSending, setFrSending] = useState(false);
  const [frVerifying, setFrVerifying] = useState(false);

  useEffect(() => {
    if (!search.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const [internshipRes, jobRes] = await Promise.all([
          api.get("/internship"),
          api.get("/job"),
        ]);
        const q = search.trim().toLowerCase();
        const internships: SearchItem[] = (internshipRes.data || [])
          .filter(
            (item: any) =>
              item.title?.toLowerCase().includes(q) ||
              item.company?.toLowerCase().includes(q) ||
              item.location?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((item: any) => ({
            type: "internship" as const,
            _id: item._id,
            title: item.title,
            company: item.company,
            location: item.location,
          }));
        const jobs: SearchItem[] = (jobRes.data || [])
          .filter(
            (item: any) =>
              item.title?.toLowerCase().includes(q) ||
              item.company?.toLowerCase().includes(q) ||
              item.location?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q)
          )
          .slice(0, 5)
          .map((item: any) => ({
            type: "job" as const,
            _id: item._id,
            title: item.title,
            company: item.company,
            location: item.location,
          }));
        setResults([...internships, ...jobs]);
        setShowDropdown(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.role === "admin") {
        setAdmin();
        toast.success(t("toast.loggedInAsAdmin"));
        router.push("/adminpanel");
      } else {
        toast.success(t("toast.loggedInSuccessfully"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("toast.loginFailed"));
    }
  };
  const handleLogout = () => {
    clearAdmin();
    dispatch(logout());
    signOut(auth);
    router.push("/");
  };

  const handleLangSwitch = (code: LangCode) => {
    setLangDropdownOpen(false);
    if (code === "fr" && !isFrSessionVerified()) {
      setFrEmail(user?.email || "");
      setFrStep(user?.email ? "otp" : "email");
      setFrCode("");
      setFrModalOpen(true);
      return;
    }
    setLang(code);
  };

  const handleFrSendOtp = async () => {
    if (!frEmail) return;
    setFrSending(true);
    try {
      await api.post("/language/send-otp", { email: frEmail });
      toast.success(t("lang.otpSent", { email: frEmail }));
      setFrStep("otp");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("lang.failed"));
    } finally {
      setFrSending(false);
    }
  };

  const handleFrVerifyOtp = async () => {
    if (!frCode) return;
    setFrVerifying(true);
    try {
      await api.post("/language/verify-otp", { email: frEmail, code: frCode });
      markFrSessionVerified();
      setLang("fr");
      setFrModalOpen(false);
      toast.success(t("lang.verified"));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || t("lang.failed"));
    } finally {
      setFrVerifying(false);
    }
  };

  return (
    <div className="relative">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <a href="/" className="text-xl font-bold text-blue-600">
                <img src={"/logo.png"} alt="" className="h-16" />
              </a>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/internship"}>
                  <span>{t("nav.internships")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/job"}>
                  <span>{t("nav.jobs")}</span>
                </Link>
              </button>
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/publicspace"}>
                  <span>{t("nav.publicSpace")}</span>
                </Link>
              </button>
              {user && (
                <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <Link href={"/discover"}>
                    <span>{t("nav.discover")}</span>
                  </Link>
                </button>
              )}
              <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                <Link href={"/plans"}>
                  <span>{t("nav.plans")}</span>
                </Link>
              </button>
              {user && (
                <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
                  <Link href={"/resume"}>
                    <span>{t("nav.resume")}</span>
                  </Link>
                </button>
              )}
              <div className="relative" ref={searchRef}>
                <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder={t("nav.searchPlaceholder")}
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setShowDropdown(true);
                    }}
                    className="ml-2 bg-transparent focus:outline-none text-sm w-48"
                  />
                </div>
                {showDropdown && (
                  <div className="absolute top-full mt-2 w-80 bg-white shadow-lg rounded-xl border border-gray-200 py-2 z-50">
                    {searching && (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        {t("nav.searching")}
                      </p>
                    )}
                    {!searching && results.length === 0 && (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        {t("nav.noResults")}
                      </p>
                    )}
                    {!searching && results.length > 0 && (
                      <>
                        {results.some((r) => r.type === "internship") && (
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                            {t("nav.internshipsHeader")}
                          </p>
                        )}
                        {results
                          .filter((r) => r.type === "internship")
                          .map((item) => (
                            <Link
                              key={`internship-${item._id}`}
                              href={`/internship/${item._id}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setSearch("");
                              }}
                              className="block px-4 py-2 hover:bg-gray-50"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.company} · {item.location}
                              </p>
                            </Link>
                          ))}
                        {results.some((r) => r.type === "job") && (
                          <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase">
                            {t("nav.jobsHeader")}
                          </p>
                        )}
                        {results
                          .filter((r) => r.type === "job")
                          .map((item) => (
                            <Link
                              key={`job-${item._id}`}
                              href={`/job/${item._id}`}
                              onClick={() => {
                                setShowDropdown(false);
                                setSearch("");
                              }}
                              className="block px-4 py-2 hover:bg-gray-50"
                            >
                              <p className="text-sm font-medium text-gray-800">
                                {item.title}
                              </p>
                              <p className="text-xs text-gray-500">
                                {item.company} · {item.location}
                              </p>
                            </Link>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative" ref={langRef}>
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  {LANGS.find((l) => l.code === lang)?.label || "English"}
                </button>
                {langDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white shadow-lg rounded-lg border border-gray-200 py-1 z-50">
                    {LANGS.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLangSwitch(l.code)}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${lang === l.code ? "text-blue-600 font-semibold" : "text-gray-700"}`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {user ? (
                <div className="relative flex items-center space-x-2">
                  <Link href={"/profile"}>
                    {user.photo ? (
                      <img
                        src={user.photo}
                        alt={user.name || t("nav.profileAlt")}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <button
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    onClick={handleLogout}
                  >
                    {t("nav.logout")}
                  </button>
                </div>
              ) : (
                <>
                  <Link href="/login?tab=admin">
                    <span className="text-gray-600 hover:text-gray-800">
                      {t("nav.admin")}
                    </span>
                  </Link>
                  <Link href="/login?tab=register">
                    <span className="text-gray-600 hover:text-gray-800">
                      {t("nav.user")}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogin}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 flex items-center justify-center space-x-2 hover:bg-gray-50 "
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-gray-700 hidden lg:inline">
                      {t("nav.signInGoogle")}
                    </span>
                    <span className="text-gray-700 lg:hidden">{t("nav.googleShort")}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {frModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t("lang.title")}</h2>
            <p className="text-sm text-gray-600 mb-4">{t("lang.description")}</p>
            {frStep === "email" ? (
              <>
                <input
                  type="email"
                  placeholder={t("lang.emailPlaceholder")}
                  value={frEmail}
                  onChange={(e) => setFrEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setFrModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t("lang.cancel")}</button>
                  <button onClick={handleFrSendOtp} disabled={!frEmail || frSending} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{frSending ? t("lang.sending") : t("lang.sendOtp")}</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-3">{t("lang.otpRequired")}</p>
                <input
                  type="text"
                  placeholder={t("lang.otpPlaceholder")}
                  value={frCode}
                  onChange={(e) => setFrCode(e.target.value)}
                  maxLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-400 mb-4">{t("lang.otpExpiry")}</p>
                <div className="flex justify-between">
                  <button onClick={handleFrSendOtp} disabled={frSending} className="text-sm text-blue-600 hover:underline disabled:opacity-50">{t("lang.resend")}</button>
                  <div className="space-x-3">
                    <button onClick={() => setFrModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t("lang.cancel")}</button>
                    <button onClick={handleFrVerifyOtp} disabled={!frCode || frVerifying} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{frVerifying ? t("lang.verifying") : t("lang.verifyOtp")}</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;