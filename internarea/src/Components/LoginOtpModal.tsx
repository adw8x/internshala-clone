import api from "@/lib/api";
import { useLanguage } from "@/lib/i18n";
import { useEffect, useState } from "react";

interface Props {
  email: string;
  onClose: () => void;
  onVerified: (user: { email: string; name: string; role: "user" | "admin" }) => void;
}

export default function LoginOtpModal({ email, onClose, onVerified }: Props) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"send" | "otp">("send");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    handleSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = async () => {
    setSending(true);
    try {
      await api.post("/auth/login-otp/send", { email });
      setStep("otp");
    } catch (err: any) {
      alert(err?.response?.data?.error || "Could not send OTP");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.post("/auth/login-otp/verify", { email, code });
      onVerified(res.data.user);
    } catch (err: any) {
      alert(err?.response?.data?.error || "Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {t("login.otpTitle")}
        </h2>
        <p className="text-sm text-gray-600 mb-4">{t("login.otpDescription")}</p>
        <p className="text-sm text-gray-500 mb-3">
          {t("lang.otpSent", { email })}
        </p>
        <input
          type="text"
          placeholder={t("lang.otpPlaceholder")}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          maxLength={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-400 mb-4">{t("lang.otpExpiry")}</p>
        <div className="flex justify-between">
          <button onClick={handleSend} disabled={sending} className="text-sm text-blue-600 hover:underline disabled:opacity-50">
            {step === "send" ? t("lang.sending") : t("lang.resend")}
          </button>
          <div className="space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              {t("lang.cancel")}
            </button>
            <button onClick={handleVerify} disabled={!code || code.length !== 6 || verifying} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {verifying ? t("lang.verifying") : t("lang.verifyOtp")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}