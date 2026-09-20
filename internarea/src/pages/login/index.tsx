import { Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import api from "@/lib/api";
import { setAdmin } from "@/lib/auth";
import { signInWithGoogle } from "@/lib/googleLogin";
import { login } from "@/Feature/Userslice";
import { useLanguage } from "@/lib/i18n";
import LoginOtpModal from "@/Components/LoginOtpModal";

type Tab = "register" | "admin";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const tabParam = (router.query.tab as Tab) || "register";
  const [tab, setTab] = useState<Tab>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
    phone: "",
  });
  const [isloading, setIsloading] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<"signin" | "create">("create");
  const [registerSubTab, setRegisterSubTab] = useState<"signin" | "create">("signin");
  const [otpPending, setOtpPending] = useState<string | null>(null);
  const [otpGoogle, setOtpGoogle] = useState<{ uid: string; name: string; photo: string | null } | null>(null);

  const handleOtpVerified = async (userData: { email: string; name: string }) => {
    setOtpPending(null);
    if (otpGoogle) {
      dispatch(
        login({
          uid: otpGoogle.uid,
          name: otpGoogle.name,
          email: userData.email,
          photo: otpGoogle.photo ?? "",
        })
      );
      toast.success(t("login.loggedIn"));
      goHome();
      return;
    }
    await finalizeLogin(userData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const goHome = () => {
    const returnTo = router.query.returnTo as string;
    router.push(returnTo || "/");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error(t("login.fillAllDetails"));
      return;
    }
    setIsloading(true);
    try {
      const res = await api.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: "user",
      });
      try {
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name });
      } catch {}
      dispatch(
        login({
          uid: res.data.user.email,
          name: res.data.user.name,
          email: res.data.user.email,
          photo: "",
        })
      );
      toast.success(t("login.registered"));
      goHome();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || t("login.registrationFailed"));
    } finally {
      setIsloading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error(t("login.fillAllDetails"));
      return;
    }
    setIsloading(true);
    try {
      const res = await api.post(
        "/auth/login",
        {
          email: form.email,
          password: form.password,
        },
        { headers: { "x-user-agent": navigator.userAgent } }
      );
      if (res.data.otpRequired) {
        setOtpPending(res.data.email);
        return;
      }
      await finalizeLogin(res.data.user);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || error?.message || t("toast.loginFailed"));
    } finally {
      setIsloading(false);
    }
  };

  const finalizeLogin = async (userData: { email: string; name: string }) => {
    try {
      await signInWithEmailAndPassword(auth, userData.email, form.password);
    } catch {
      try {
        const cred = await createUserWithEmailAndPassword(auth, userData.email, form.password);
        await updateProfile(cred.user, { displayName: userData.name });
      } catch {}
    }
    dispatch(
      login({
        uid: userData.email,
        name: userData.name,
        email: userData.email,
        photo: "",
      })
    );
    toast.success(t("login.loggedIn"));
    goHome();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error(t("login.fillAllDetails"));
      return;
    }
    setIsloading(true);
    try {
      const res = await api.post("/admin/adminlogin", {
        username: form.email,
        password: form.password,
      });
      setAdmin();
      try {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      } catch {
        try {
          const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
          await updateProfile(cred.user, { displayName: res.data.user.name });
        } catch {}
      }
      dispatch(
        login({
          uid: res.data.user.email,
          name: res.data.user.name,
          email: res.data.user.email,
          photo: "",
        })
      );
      toast.success(t("toast.loggedInAsAdmin"));
      router.push("/adminpanel");
    } catch (error) {
      toast.error(t("login.invalidAdminCredentials"));
    } finally {
      setIsloading(false);
    }
  };

  const handleAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      toast.error(t("login.fillAllDetails"));
      return;
    }
    setIsloading(true);
    try {
      await api.post("/admin/register", {
        username: form.username,
        email: form.email,
        password: form.password,
      });
      toast.success(t("login.adminAccountCreated"));
      setAdminSubTab("signin");
      setForm((prev) => ({ ...prev, password: "" }));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || t("login.createAdminFailed"));
    } finally {
      setIsloading(false);
    }
  };

  const handleGoogle = async () => {
    setIsloading(true);
    try {
      const result = await signInWithGoogle();
      if (result.otpRequired) {
        setOtpGoogle({ uid: result.uid, name: result.name, photo: result.photo });
        setOtpPending(result.email);
        return;
      }
      if (result.role === "admin") {
        setAdmin({ email: result.email, name: result.name });
        toast.success(t("toast.loggedInAsAdmin"));
        router.push("/adminpanel");
      } else {
        dispatch(
          login({
            uid: result.uid,
            name: result.name,
            email: result.email,
            photo: result.photo,
          })
        );
        toast.success(t("login.loggedIn"));
        goHome();
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || t("toast.googleSignInFailed"));
    } finally {
      setIsloading(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "register", label: t("login.tabUser") },
    { key: "admin", label: t("login.tabAdmin") },
  ];

  const inputCls =
    "block w-full text-black pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const submitBtn =
    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  const googleLabel =
    tab === "admin"
      ? adminSubTab === "create"
        ? t("login.googleSignUpAdmin")
        : t("login.googleSignInAdmin")
      : registerSubTab === "create"
      ? t("login.googleCreateAccount")
      : t("login.googleContinue");

  const dividerText =
    tab === "register"
      ? registerSubTab === "create"
        ? t("login.dividerCreateAccount")
        : t("login.dividerCredentials")
      : adminSubTab === "create"
      ? t("login.dividerCreateAdmin")
      : t("login.dividerCredentials");

  return (
    <>
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {t("login.welcome")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("login.subtitle")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex-1 pb-3 text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={isloading}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 flex items-center justify-center space-x-2 hover:bg-gray-50 disabled:opacity-50"
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
            <span className="text-gray-700">{googleLabel}</span>
          </button>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-200"></div>
            <span className="px-3 text-sm text-gray-500">{dividerText}</span>
            <div className="flex-1 border-t border-gray-200"></div>
          </div>

          {/* Register Tab */}
          {tab === "register" && (
            <>
              {/* Register sub-tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setRegisterSubTab("create")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    registerSubTab === "create"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("login.createAccount")}
                </button>
                <button
                  onClick={() => setRegisterSubTab("signin")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    registerSubTab === "signin"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("login.signIn")}
                </button>
              </div>

              {/* Create Account */}
              {registerSubTab === "create" && (
                <form className="space-y-6" onSubmit={handleRegister}>
                  <div>
                    <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">
                      {t("login.fullName")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="reg-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.fullNamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700">
                      {t("login.email")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.emailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700">
                      {t("login.password")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="reg-password"
                        name="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.passwordMin")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">
                      {t("login.phone")}{" "}
                      <span className="text-gray-400 font-normal">{t("login.optional")}</span>
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <input
                        id="reg-phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        className="block w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder={t("login.phonePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={isloading} className={submitBtn}>
                      {isloading ? t("login.registering") : t("login.createAccount")}
                    </button>
                  </div>
                </form>
              )}

              {/* Sign In */}
              {registerSubTab === "signin" && (
                <form className="space-y-6" onSubmit={handleLogin}>
                  <div>
                    <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">
                      {t("login.email")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.emailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                      {t("login.password")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="login-password"
                        name="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.passwordPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={isloading} className={submitBtn}>
                      {isloading ? t("login.signingIn") : t("login.signIn")}
                    </button>
                  </div>
                  <div className="text-sm text-center">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t("login.forgotPassword")}
                    </Link>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Admin Tab */}
          {tab === "admin" && (
            <>
              {/* Admin sub-tabs */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setAdminSubTab("create")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    adminSubTab === "create"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("login.createAccount")}
                </button>
                <button
                  onClick={() => setAdminSubTab("signin")}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                    adminSubTab === "signin"
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {t("login.signIn")}
                </button>
              </div>

              {/* Admin Sign In */}
              {adminSubTab === "signin" && (
                <form className="space-y-6" onSubmit={handleAdminLogin}>
                  <div>
                    <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">
                      {t("login.email")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="admin-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.adminEmailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="admin-signin-password" className="block text-sm font-medium text-gray-700">
                      {t("login.password")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="admin-signin-password"
                        name="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.adminPasswordPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={isloading} className={submitBtn}>
                      {isloading ? t("login.signingIn") : t("login.signInAsAdmin")}
                    </button>
                  </div>
                <div className="text-sm text-center">
                    <Link
                      href="/forgot-password"
                      className="font-medium text-blue-600 hover:text-blue-700"
                    >
                      {t("login.forgotPassword")}
                    </Link>
                  </div>
                </form>
              )}

              {/* Admin Create Account */}
              {adminSubTab === "create" && (
                <form className="space-y-6" onSubmit={handleAdminRegister}>
                  <div>
                    <label htmlFor="admin-create-username" className="block text-sm font-medium text-gray-700">
                      {t("login.adminName")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="admin-create-username"
                        name="username"
                        type="text"
                        required
                        value={form.username}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.adminNamePlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="admin-create-email" className="block text-sm font-medium text-gray-700">
                      {t("login.email")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="admin-create-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.adminEmailPlaceholder")}
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="admin-create-password" className="block text-sm font-medium text-gray-700">
                      {t("login.password")}
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="admin-create-password"
                        name="password"
                        type="password"
                        required
                        value={form.password}
                        onChange={handleChange}
                        className={inputCls}
                        placeholder={t("login.passwordMin")}
                      />
                    </div>
                  </div>
                  <div>
                    <button type="submit" disabled={isloading} className={submitBtn}>
                      {isloading ? t("login.creatingAccount") : t("login.createAdminAccount")}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {otpPending && (
      <LoginOtpModal
        email={otpPending}
        onClose={() => {
          setOtpPending(null);
          setOtpGoogle(null);
        }}
        onVerified={handleOtpVerified}
      />
    )}
    </>
  );
}
