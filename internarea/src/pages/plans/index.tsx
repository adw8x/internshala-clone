import { selectuser } from "@/Feature/Userslice";
import { Check, Crown, X } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import api from "@/lib/api";

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
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [payingPlan, setPayingPlan] = useState<string | null>(null);

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
      toast.error("Please sign in to subscribe");
      router.push("/");
      return;
    }
    setPayingPlan(planId);
    try {
      const loaded = await loadRazorpayScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!loaded) {
        toast.error("Could not load payment gateway. Please try again.");
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
            toast.success(verifyRes.data.message || "Payment successful");
            loadStatus();
          } catch (verifyErr: any) {
            toast.error(verifyErr?.response?.data?.error || "Payment not verified");
          }
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      });

      razorpay.on("payment.failed", (response: any) => {
        toast.error("Payment failed. Please try again.");
        setPayingPlan(null);
      });

      razorpay.open();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        "Payment is currently unavailable. Payments are allowed only between 10:00 AM and 11:00 AM IST.";
      toast.error(msg);
      setPayingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="mt-2 text-gray-600">
            Choose a plan to manage your internship applications
          </p>
        </div>

        {/* Payment window notice */}
        <div className="max-w-xl mx-auto mb-10 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm text-center">
          Payments are only accepted between <strong>10:00 AM and 11:00 AM IST</strong>. Attempts outside this window will be blocked.
        </div>

        {/* Current subscription status */}
        {status && currentPlan && (
          <div className="max-w-xl mx-auto mb-10 bg-white rounded-lg shadow p-4 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Current plan</span>
              <span className="font-semibold text-blue-600">{currentPlan.name} Plan</span>
            </div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-600">Applications used</span>
              <span className="font-semibold text-gray-800">
                {status.remaining === -1
                  ? "Unlimited"
                  : `${status.applicationsUsed} / ${status.applicationsPerMonth}`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Valid until</span>
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
                  <span className="text-sm font-normal text-gray-500">/month</span>
                </p>
                <p className="text-sm text-gray-600 mb-4 flex items-center gap-1">
                  <Check className="h-4 w-4 text-green-500" />
                  {plan.description}
                </p>
                {isCurrent ? (
                  <div className="mt-auto bg-blue-50 text-blue-700 text-center py-2 rounded-lg font-medium">
                    Current Plan
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
                    {payingPlan === plan.id ? "Processing..." : isFree ? "Default" : "Subscribe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PlansPage;
