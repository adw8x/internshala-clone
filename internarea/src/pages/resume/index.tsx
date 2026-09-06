import { selectuser } from "@/Feature/Userslice";
import api from "@/lib/api";
import {
  Briefcase,
  Check,
  Crown,
  FileText,
  GraduationCap,
  Lock,
  Mail,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

interface SubscriptionStatus {
  planId: string;
  planName: string;
  plans: { id: string; name: string; applicationsPerMonth: number }[];
}

interface ResumeListItem {
  _id: string;
  name: string;
  status: string;
  amountINR: number;
  paidAt: string | null;
  createdAt: string;
}

interface EduRow {
  degree: string;
  institution: string;
  year: string;
  percentage: string;
}

interface ExpRow {
  company: string;
  role: string;
  duration: string;
  description: string;
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

const resizePhoto = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const max = 300;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });

const emptyEducation = (): EduRow => ({
  degree: "",
  institution: "",
  year: "",
  percentage: "",
});

const emptyExperience = (): ExpRow => ({
  company: "",
  role: "",
  duration: "",
  description: "",
});

const ResumePage = () => {
  const user = useSelector(selectuser);
  const router = useRouter();
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [premium, setPremium] = useState<boolean | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [summary, setSummary] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [education, setEducation] = useState<EduRow[]>([emptyEducation()]);
  const [experience, setExperience] = useState<ExpRow[]>([emptyExperience()]);
  const [photo, setPhoto] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const [paying, setPaying] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);

  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (user?.email) {
      setName(user.name || "");
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    setLoadingStatus(true);
    api
      .get("/subscription/status", { params: { email: user.email } })
      .then((res) => {
        setSubStatus(res.data);
        setPremium(Boolean(res.data.planId) && res.data.planId !== "free");
      })
      .catch(() => setPremium(false))
      .finally(() => setLoadingStatus(false));
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    api
      .get("/resume", { params: { email: user.email } })
      .then((res) => setResumes(res.data.resumes || []))
      .catch(() => {});
  }, [user?.email, generatedId]);

  const handlePhoto = (file?: File | null) => {
    if (!file) return;
    resizePhoto(file)
      .then((dataUrl) => {
        setPhoto(dataUrl);
        setPhotoPreview(dataUrl);
      })
      .catch(() => toast.error("Please choose a valid image file"));
  };

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setSendingOtp(true);
    try {
      const res = await api.post("/resume/send-otp", { email: user.email });
      setOtpSent(true);
      toast.success(res.data.message || "OTP sent to your email");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error || "Could not send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user?.email || otpCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await api.post("/resume/verify-otp", {
        email: user.email,
        code: otpCode.trim(),
      });
      setOtpVerified(true);
      toast.success(res.data.message || "Email verified");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handlePay = async () => {
    if (!user?.email) {
      toast.error("Please sign in");
      return;
    }
    setPaying(true);
    try {
      const loaded = await loadRazorpayScript(
        "https://checkout.razorpay.com/v1/checkout.js"
      );
      if (!loaded) {
        toast.error("Could not load payment gateway. Please try again.");
        return;
      }

      const orderRes = await api.post("/resume/create-order", {
        email: user.email,
        name,
        phone,
        address,
        summary,
        skills: skillsText
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        education,
        experience,
        photo,
      });

      const { key, orderId, amount, currency, resumeId } = orderRes.data;

      const razorpay = new window.Razorpay({
        key,
        amount,
        currency,
        name: "Internshala Clone",
        description: "Professional Resume - Rs. 50",
        order_id: orderId,
        prefill: { email: user.email, name: name || user.name },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post("/resume/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              resumeId,
              email: user.email,
            });
            setGeneratedId(verifyRes.data.resumeId);
            toast.success(verifyRes.data.message || "Resume generated successfully");
          } catch (verifyErr: any) {
            toast.error(verifyErr?.response?.data?.error || "Payment not verified");
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      });

      razorpay.on("payment.failed", () => {
        toast.error("Payment failed. Please try again.");
        setPaying(false);
      });

      razorpay.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Could not start payment. Please try again.");
      setPaying(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-xl mx-auto text-center bg-white rounded-2xl shadow-lg p-10">
          <Lock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Resume Builder</h1>
          <p className="text-gray-600 mb-6">
            Sign in to create a professional resume that will be attached to your
            internship applications.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const latestPaid = resumes.find((r) => r.status === "paid");

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Resume Builder</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Fill in your details and we&apos;ll generate a professional resume for
            you. Premium plans only · Rs. 50 per resume · Automatically attached
            to your internship applications.
          </p>
        </div>

        {loadingStatus ? (
          <p className="text-center text-gray-500">Checking your plan...</p>
        ) : premium === false ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center border-2 border-yellow-200">
            <Crown className="h-10 w-10 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Premium Plan Required
            </h2>
            <p className="text-gray-600 mb-6">
              The Resume Builder is available only on a premium plan (Bronze,
              Silver, or Gold). Upgrade now to unlock it.
            </p>
            <Link
              href="/plans"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700"
            >
              View Plans
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8">
              {/* Existing resumes */}
              {resumes.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">
                    My Resumes
                  </h2>
                  <div className="space-y-2">
                    {resumes.map((r) => (
                      <div
                        key={r._id}
                        className="flex items-center justify-between border rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-medium text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-500">
                              {r.status === "paid" ? "Paid · Ready" : "Awaiting payment"} · ₹{r.amountINR} ·{" "}
                              {new Date(r.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </div>
                        {r.status === "paid" && (
                          <Link
                            href={`/resume/${r._id}`}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            View / Print
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedId && (
                <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-green-800">
                    <Check className="h-5 w-5" />
                    <span className="font-medium">
                      Resume generated successfully — attached to your profile for
                      future applications.
                    </span>
                  </div>
                  <Link
                    href={`/resume/${generatedId}`}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    View Resume
                  </Link>
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Enter Your Details
              </h2>

              {/* Photo */}
              <div className="mb-6 flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserPlaceholder />
                  )}
                </div>
                <label className="inline-flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 cursor-pointer hover:bg-gray-50">
                  <Upload className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handlePhoto(e.target.files?.[0])}
                  />
                </label>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Field label="Full Name *">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </Field>
                <Field label="Registered Email *">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={user.email || ""}
                      disabled
                      className="w-full pl-9 pr-3 py-2 border rounded-lg bg-gray-100 text-gray-500"
                    />
                  </div>
                </Field>
                <Field label="Phone">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </Field>
                <Field label="Address">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </Field>
              </div>

              <div className="mb-4">
                <Field label="Professional Summary">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    placeholder="Briefly describe yourself, your strengths, and career goals..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  ></textarea>
                </Field>
              </div>

              <div className="mb-4">
                <Field label="Skills (comma separated)">
                  <input
                    type="text"
                    value={skillsText}
                    onChange={(e) => setSkillsText(e.target.value)}
                    placeholder="React, Node.js, MongoDB, Communication..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </Field>
              </div>

              {/* Education */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Qualifications</h3>
                </div>
                {education.map((edu, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const next = [...education];
                        next[i] = { ...next[i], degree: e.target.value };
                        setEducation(next);
                      }}
                      placeholder="Degree / Course *"
                      className="px-3 py-2 border rounded-lg text-sm text-black"
                    />
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const next = [...education];
                        next[i] = { ...next[i], institution: e.target.value };
                        setEducation(next);
                      }}
                      placeholder="Institution"
                      className="px-3 py-2 border rounded-lg text-sm text-black"
                    />
                    <input
                      type="text"
                      value={edu.year}
                      onChange={(e) => {
                        const next = [...education];
                        next[i] = { ...next[i], year: e.target.value };
                        setEducation(next);
                      }}
                      placeholder="Year"
                      className="px-3 py-2 border rounded-lg text-sm text-black"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={edu.percentage}
                        onChange={(e) => {
                          const next = [...education];
                          next[i] = { ...next[i], percentage: e.target.value };
                          setEducation(next);
                        }}
                        placeholder="% / CGPA"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm text-black"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEducation(education.filter((_, idx) => idx !== i))
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setEducation([...education, emptyEducation()])}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" /> Add qualification
                </button>
              </div>

              {/* Experience */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Experience</h3>
                </div>
                {experience.map((exp, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const next = [...experience];
                          next[i] = { ...next[i], company: e.target.value };
                          setExperience(next);
                        }}
                        placeholder="Company"
                        className="px-3 py-2 border rounded-lg text-sm text-black"
                      />
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const next = [...experience];
                          next[i] = { ...next[i], role: e.target.value };
                          setExperience(next);
                        }}
                        placeholder="Role"
                        className="px-3 py-2 border rounded-lg text-sm text-black"
                      />
                      <input
                        type="text"
                        value={exp.duration}
                        onChange={(e) => {
                          const next = [...experience];
                          next[i] = { ...next[i], duration: e.target.value };
                          setExperience(next);
                        }}
                        placeholder="Duration (e.g. Jan 2025 - Jun 2025)"
                        className="px-3 py-2 border rounded-lg text-sm text-black"
                      />
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={exp.description}
                        onChange={(e) => {
                          const next = [...experience];
                          next[i] = { ...next[i], description: e.target.value };
                          setExperience(next);
                        }}
                        rows={2}
                        placeholder="What did you do there?"
                        className="flex-1 px-3 py-2 border rounded-lg text-sm text-black"
                      ></textarea>
                      <button
                        type="button"
                        onClick={() =>
                          setExperience(experience.filter((_, idx) => idx !== i))
                        }
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setExperience([...experience, emptyExperience()])}
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="h-4 w-4" /> Add experience
                </button>
              </div>

              {/* OTP + Payment */}
              <div className="mt-8 border-t pt-6">
                {!otpVerified ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Step 1 · Verify Your Email
                    </h3>
                    <p className="text-sm text-blue-800 mb-3">
                      We&apos;ll send a one-time password (OTP) to{" "}
                      <strong>{user.email}</strong> before you can pay for your
                      resume.
                    </p>
                    {!otpSent ? (
                      <button
                        onClick={handleSendOtp}
                        disabled={sendingOtp || !name.trim()}
                        className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                      >
                        {sendingOtp ? "Sending..." : "Send OTP"}
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="Enter 6-digit OTP"
                          className="w-48 px-3 py-2 border rounded-lg text-center text-lg tracking-widest text-black"
                        />
                        <button
                          onClick={handleVerifyOtp}
                          disabled={verifyingOtp || otpCode.length !== 6}
                          className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                          {verifyingOtp ? "Verifying..." : "Verify OTP"}
                        </button>
                        <button
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          className="text-blue-600 hover:underline text-sm font-medium px-2"
                        >
                          Resend
                        </button>
                      </div>
                    )}
                    {otpSent && !otpVerified && (
                      <p className="text-xs text-blue-600 mt-2">
                        OTP expires in 5 minutes. Check your inbox (and spam).
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Email verified. You can now pay and generate your resume.
                    </span>
                  </div>
                )}

                <button
                  onClick={handlePay}
                  disabled={!otpVerified || paying}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {paying
                    ? "Processing..."
                    : latestPaid && latestPaid.status === "paid" && !generatedId
                    ? "Generate Another Resume - Rs. 50"
                    : "Pay Rs. 50 & Generate Resume"}
                </button>
                <p className="text-center text-xs text-gray-500 mt-3">
                  Secure payment via Razorpay. Your resume is automatically
                  attached to your profile for future internship applications.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <label className="block">
    <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
    {children}
  </label>
);

const UserPlaceholder = () => (
  <svg
    className="h-10 w-10 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);

export default ResumePage;