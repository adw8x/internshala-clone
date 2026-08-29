import { ArrowLeft, KeyRound, Mail, Phone } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-toastify";
import api from "@/lib/api";

type Delivery = "email" | "phone";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [delivery, setDelivery] = useState<Delivery>("email");
  const [loading, setLoading] = useState(false);
  const [fallbackLink, setFallbackLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      toast.error("Please enter your registered email or phone number");
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
        toast.error("You can use this option only once per day.");
      } else {
        toast.error(errMsg || error?.message || "Failed to send reset link");
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
          Forgot Password
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter your registered email or phone number and we will send you a
          link to reset your password.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                Email or Phone Number
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
                      ? "Enter your registered email"
                      : "Enter your registered phone number"
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Send reset link via
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
                  Email
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
                  Phone (SMS)
                </button>
              </div>
            </div>

            <div>
              <button type="submit" disabled={loading} className={submitBtn}>
                {loading ? "Sending..." : "Send Reset Link"}
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
                        Reset Password
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
              Back to sign in
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        <KeyRound className="h-4 w-4 inline mr-1" />
        You can request a password reset only once per day.
      </div>
    </div>
  );
}