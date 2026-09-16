import { selectuser } from "@/Feature/Userslice";
import { Check, Crown, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import api from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface PlanData {
  id: string;
  name: string;
  monthlyPriceINR: number;
  applicationsPerMonth: number;
  description: string;
}

interface SubscriptionStatus {
  planId: string;
  applicationsPerMonth: number;
  applicationsUsed: number;
  remaining: number;
  periodEnd: string;
  plans: PlanData[];
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const PlansPage = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  const { t } = useLanguage();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);
  const [verifyOrderId, setVerifyOrderId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!verifyOrderId.trim()) return;
    setVerifying(true);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const res = await api.post("/payment/verify-order", {
        razorpay_order_id: verifyOrderId.trim(),
      });
      setVerifyResult(res.data);
    } catch (err: any) {
      setVerifyError(err?.response?.data?.error || t("plans.verificationFailed"));
    } finally {
      setVerifying(false);
    }
  };

  const loadStatus = () => {
    if (!user?.email) return;
    api
      .get("/subscription/status", { params: { email: user.email } })
      .then((res) => setStatus(res.data))
      .catch(() => {});
  };

  useEffect(() => {
    loadStatus();
  }, [user?.email]);

  const isPaid = status?.planId && status.planId !== "free";
  const currentPlan = status?.plans?.find((p) => p.id === status.planId);

  const handleSubscribe = async (planId: string, plan: PlanData) => {
    if (!user?.email) {
      toast.error(t("plans.signInRequired"));
      router.push("/");
      return;
    }
    setPayingPlan(planId);
    try {
      const loaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        toast.error(t("plans.gatewayFailed"));
        return;
      }

      const orderRes = await api.post("/payment/create-order", {
        email: user.email,
        name: user.name,
        planId,
      });

      const { key, orderId, amount, currency, amountINR, description } = orderRes.data;

      const razorpay = new window.Razorpay({
        key,
        amount,
        currency,
        name: "Internshala Clone",
        description,
        order_id: orderId,
        prefill: { email: user.email, name: user.name || "" },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/payment/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
              email: user.email,
              name: user.name,
            });
            toast.success(verifyRes.data.message || t("plans.paymentSuccessful"));
            loadStatus();
          } catch (verifyErr: any) {
            toast.error(verifyErr?.response?.data?.error || t("plans.paymentNotVerified"));
          }
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      });

      razorpay.on("payment.failed", (response: any) => {
        toast.error(t("plans.paymentFailed"));
        setPayingPlan(null);
      });

      razorpay.open();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        t("plans.paymentUnavailable");
      toast.error(msg);
      setPayingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{t("plans.title")}</h1>
          <p className="mt-2 text-gray-600">
            {t("plans.subtitle")}
          </p>
        </div>

        {/* Payment window notice */}
        <div className="max-w-xl mx-auto mb-10 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center">
          {t("plans.paymentWindowNotice")}
        </div>

        {/* Current subscription status */}
        {status && currentPlan && (
          <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow p-4 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">{t("plans.currentPlan")}</span>
              <span className="font-semibold text-blue-600">{t("plans.planName", { name: currentPlan.name })}</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">{t("plans.applicationsUsed")}</span>
              <span className="font-semibold text-gray-800">
                {status.remaining === -1
                  ? t("plans.unlimited")
                  : `${status.applicationsUsed} / ${status.applicationsPerMonth}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{t("plans.validUntil")}</span>
              <span className="font-semibold text-gray-800">
                {new Date(status.periodEnd).toLocaleDateString("en-IN")}
              </span>
            </div>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {(status?.plans || []).map((plan) => {
            const isCurrent = plan.id === status?.planId;
            const isFree = plan.id === "free";
            const isPaidPlan = !isFree;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-lg p-6 flex flex-col border-2 ${
                  isCurrent ? "border-blue-600" : "border-transparent"
                }`}
              >
                <div className="flex items-center mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  {plan.id === "gold" && <Crown className="ml-2 h-5 w-5 text-yellow-500" />}
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-2">
                  ₹{plan.monthlyPriceINR}
                  <span className="text-sm font-normal text-gray-500">{t("plans.perMonth")}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  {plan.description}
                </p>
                {isCurrent ? (
                  <div className="mt-auto bg-blue-50 text-blue-700 text-center py-2 rounded-lg font-medium">
                    {t("plans.currentPlanBadge")}
                  </div>
                ) : (
                  <button
                    onClick={() => isPaidPlan && !isCurrent && handleSubscribe(plan.id, plan)}
                    disabled={!isPaidPlan || isCurrent || payingPlan !== null}
                    className={`mt-auto py-2 rounded-lg font-medium transition ${
                      isFree
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    } disabled:opacity-50`}
                  >
                    {payingPlan === plan.id ? t("plans.processing") : isFree ? t("plans.defaultPlan") : t("plans.subscribe")}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment verification */}
        <div className="max-w-xl mx-auto mt-10 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">{t("plans.verifyPayment")}</h2>
          <p className="text-sm text-gray-600 mb-4">
            {t("plans.verifyDescription")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={verifyOrderId}
              onChange={(e) => setVerifyOrderId(e.target.value)}
              placeholder={t("plans.verifyPlaceholder")}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || !verifyOrderId.trim()}
              className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
            >
              {verifying ? t("plans.verifying") : t("plans.verify")}
            </button>
          </div>
          {verifyError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {verifyError}
            </div>
          )}
          {verifyResult && (
            <div
              className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
                verifyResult.verified
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-yellow-50 border-yellow-200 text-yellow-800"
              }`}
            >
              <div className="flex items-center gap-2 font-semibold mb-2">
                {verifyResult.verified
                  ? t("plans.verified")
                  : t("plans.notCompleted")}
              </div>
              <div className="space-y-1 text-gray-700">
                <div>
                  {t("plans.order", { orderId: verifyResult.orderId })}
                </div>
                <div>{t("plans.orderStatus", { orderStatus: verifyResult.orderStatus })}</div>
                <div>
                  {t("plans.amount", { amount: verifyResult.amountINR, currency: verifyResult.currency })}
                </div>
                {verifyResult.payment && (
                  <>
                    <div>
                      {t("plans.paymentId", { id: verifyResult.payment.id })}
                    </div>
                    <div>{t("plans.paymentStatus", { status: verifyResult.payment.status })}</div>
                    <div>{t("plans.method", { method: verifyResult.payment.method })}</div>
                    {verifyResult.payment.card && (
                      <div>
                        {t("plans.card", {
                          network: verifyResult.payment.card.network,
                          last4: verifyResult.payment.card.last4,
                        })}
                      </div>
                    )}
                    {verifyResult.paidAt && (
                      <div>
                        {t("plans.paidAt", {
                          date: new Date(verifyResult.paidAt * 1000).toLocaleString("en-IN"),
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            {t("plans.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
