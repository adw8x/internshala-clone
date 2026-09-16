import { ArrowLeft, KeyRound, Mail, Phone } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

type Delivery = "email" | "phone";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [identifier, setIdentifier] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("email");
  const [loading, setLoading] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error(t("forgotPassword.enterIdentifier"));
      return;
    }
    setLoading(true);
    setFallbackLink(null);
    setMessage(null);
    try {
      const res = await api.post("/auth/forgot-password", {
        identifier: identifier.trim(),
        delivery,
      });
      setMessage(res.data.message);
      if (res.data.link) setFallbackLink(res.data.link);
      toast.success(res.data.message);
    } catch (error: any) {
      const errMsg = error?.response?.data?.error;
      if (errMsg === "You can use this option only once per day.") {
        toast.error(t("forgotPassword.onePerDayToast"));
      } else {
        toast.error(errMsg || error?.message || t("forgotPassword.failedToSend"));
      }
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "block w-full text-black pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";
  const submitBtn =
    "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {t("forgotPassword.title")}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t("forgotPassword.description")}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                {t("forgotPassword.identifierLabel")}
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {delivery === "email" ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Phone className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className={inputCls}
                  placeholder={
                    delivery === "email"
                      ? t("forgotPassword.emailPlaceholder")
                      : t("forgotPassword.phonePlaceholder")
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("forgotPassword.deliveryLabel")}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDelivery("email")}
                  className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    delivery === "email"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  {t("forgotPassword.email")}
                </button>
                <button
                  type="button"
                  onClick={() => setDelivery("phone")}
                  className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    delivery === "phone"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  {t("forgotPassword.phone")}
                </button>
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className={submitBtn}>
                {loading ? t("forgotPassword.sending") : t("forgotPassword.sendResetLink")}
              </button>
            </div>
          </form>

{message && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">{message}</p>
                  {fallbackLink && (
                    <div className="mt-4 text-center">
                      <a
                        href={fallbackLink}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        {t("forgotPassword.resetPasswordLink")}
                      </a>
                    </div>
                  )}
                </div>
              )}

          <div className="mt-6 text-center">
            <Link
              href="/login?tab=register"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t("forgotPassword.backToSignIn")}
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        <KeyRound className="h-4 w-4 inline mr-1" />
        {t("forgotPassword.onePerDay")}
      </div>
    </div>
  );
}