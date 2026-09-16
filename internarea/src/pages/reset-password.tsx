import { CheckCircle2, KeyRound, Link2, Lock, RefreshCw, ShieldCheck } from "lucide-react";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { generatePassword } from "@/lib/password";
import { useLanguage } from "@/lib/i18n";

type Status = "loading" | "valid" | "invalid" | "success";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const token = (router.query.token as string) || "";
  const [status, setStatus] = useState<Status>("loading");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      setError(t("resetPassword.invalidLink"));
      return;
    }
    api
      .get(`/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.data.valid) {
          setName(res.data.name || "");
          setStatus("valid");
        } else {
          setStatus("invalid");
          setError(res.data.error || t("resetPassword.invalidLink"));
        }
      })
      .catch((err) => {
        setStatus("invalid");
        setError(err?.response?.data?.error || t("resetPassword.invalidLink"));
      });
  }, [token]);

  const handleGenerate = () => {
    const generated = generatePassword(10);
    setPassword(generated);
    setConfirm(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || String(password).length < 6) {
      toast.error(t("resetPassword.minLength"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("resetPassword.mismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setStatus("success");
      toast.success(t("resetPassword.updated"));
    } catch (error: any) {
      toast.error(error?.response?.data?.error || t("resetPassword.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls =
    "block w-full text-black pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const submitBtn =
    "w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {status === "success" ? t("resetPassword.updatedTitle") : t("resetPassword.title")}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === "loading" && (
            <div className="flex items-center justify-center text-gray-500 py-8">
              <RefreshCw className="h-5 w-5 animate-spin mr-2" />
              {t("resetPassword.verifying")}
            </div>
          )}

          {status === "invalid" && (
            <div className="text-center">
              <Link2 className="h-10 w-10 text-red-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-1">{error}</p>
              <a
                href="/forgot-password"
                className="inline-block mt-4 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                {t("resetPassword.requestNewLink")}
              </a>
            </div>
          )}

          {status === "valid" && (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex items-center justify-center gap-2 text-green-600 text-sm">
                <ShieldCheck className="h-5 w-5" />
                {name ? t("resetPassword.linkValidWithName", { name }) : t("resetPassword.linkValid")}
              </div>

              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                  {t("resetPassword.newPassword")}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="new-password"
                    name="password"
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    placeholder={t("resetPassword.passwordPlaceholder")}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                  {t("resetPassword.confirmPassword")}
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirm-password"
                    name="confirm"
                    type="text"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={inputCls}
                    placeholder={t("resetPassword.confirmPlaceholder")}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("resetPassword.generate")}
                </button>
                <div className="flex items-center text-xs text-gray-400">
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                  {t("resetPassword.lettersOnly")}
                </div>
              </div>

              <div>
                <button type="submit" disabled={submitting} className={submitBtn}>
                  {submitting ? t("resetPassword.updating") : t("resetPassword.update")}
                </button>
              </div>
            </form>
          )}

          {status === "success" && (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-sm text-gray-600 mb-6">
                {t("resetPassword.successMessage")}
              </p>
              <a
                href="/login?tab=register"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                {t("resetPassword.signIn")}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}