import { logout, selectuser } from "@/Feature/Userslice";
import { clearAdmin } from "@/lib/auth";
import { ExternalLink, FileText, History, Mail, Trash2, User, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { authHeaders } from "@/lib/api";
import { useLanguage } from "@/lib/i18n";

interface ProfileResume {
  _id: string;
  name: string;
  status: string;
  amountINR: number;
  createdAt: string;
  paidAt: string | null;
}

interface LoginHistoryEntry {
  _id: string;
  browser: string;
  os: string;
  deviceType: string;
  ip: string;
  status: "success" | "blocked" | "pending" | "failed";
  reason: string;
  createdAt: string;
}

const index = () => {
  const { t } = useLanguage();
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [stats, setStats] = useState({ active: 0, accepted: 0 });
  const [friendCount, setFriendCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resumes, setResumes] = useState<ProfileResume[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistoryEntry[]>([]);

  const statusLabel = (status: string) => {
    switch (status) {
      case "success":
        return t("profile.historyStatusSuccess");
      case "blocked":
        return t("profile.historyStatusBlocked");
      case "pending":
        return t("profile.historyStatusPending");
      default:
        return t("profile.historyStatusFailed");
    }
  };

  useEffect(() => {
    if (!user?.name) return;
    api
      .get("/application")
      .then((res) => {
        const apps = (res.data || []).filter(
          (app: any) => app.user?.name === user.name
        );
        setStats({
          active: apps.length,
          accepted: apps.filter((app: any) => app.status === "accepted").length,
        });
      })
      .catch((error) =>
        console.error("Failed to load application stats:", error)
      );
  }, [user?.name]);

  useEffect(() => {
    if (!user) return;
    api
      .get("/connection/list", {
        params: { type: "connections" },
        headers: authHeaders(user),
      })
      .then((res) => setFriendCount(res.data.connections.length))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;
    api
      .get("/resume", { params: { email: user.email } })
      .then((res) => setResumes(res.data.resumes || []))
      .catch(() => {});
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;
    api
      .get("/auth/login-history", { headers: authHeaders(user) })
      .then((res) => setLoginHistory(res.data.history || []))
      .catch(() => {});
  }, [user?.email]);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await api.post("/account/delete", null, { headers: authHeaders(user) });
      clearAdmin();
      dispatch(logout());
      await signOut(auth).catch(() => {});
      router.push("/");
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
      alert(t("profile.deleteFailed"));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-blue-600">
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
              {user?.photo ? (
                <img
                  src={user?.photo}
                  alt={user?.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-gray-200 flex items-center justify-center">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-16 pb-8 px-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <div className="mt-2 flex items-center justify-center text-gray-500">
                <Mail className="h-4 w-4 mr-2" />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <span className="text-blue-600 font-semibold text-2xl">
                    {stats.active}
                  </span>
                  <p className="text-blue-600 text-sm mt-1">
                    {t("profile.activeApps")}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {stats.accepted}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    {t("profile.acceptedApps")}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <span className="text-purple-600 font-semibold text-2xl">
                    {friendCount}
                  </span>
                  <p className="text-purple-600 text-sm mt-1">
                    {t("profile.connections")}
                  </p>
                </div>
              </div>

              {/* Resumes */}
              <div className="bg-blue-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-gray-900">{t("profile.myResumes")}</h3>
                  </div>
                  <Link
                    href="/resume"
                    className="text-blue-600 hover:underline text-sm font-medium"
                  >
                    {t("profile.createResume")}
                  </Link>
                </div>
                {resumes.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    {t("profile.noResumes")}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {resumes.slice(0, 5).map((r) => (
                      <div
                        key={r._id}
                        className="bg-white rounded-lg px-4 py-2.5 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                          <p className="text-xs text-gray-500">
                            {r.status === "paid" ? t("profile.resumeReady") : t("profile.resumeAwaiting")} · ₹{r.amountINR}
                          </p>
                        </div>
                        {r.status === "paid" && (
                          <Link
                            href={`/resume/${r._id}`}
                            className="text-blue-600 hover:underline text-sm font-medium"
                          >
                            {t("profile.view")}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Login History */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <History className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    {t("profile.loginHistory")}
                  </h3>
                </div>
                {loginHistory.length === 0 ? (
                  <p className="text-gray-600 text-sm">{t("profile.noLoginHistory")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 border-b border-gray-200">
                          <th className="py-2 pr-3 font-medium">{t("profile.historyTime")}</th>
                          <th className="py-2 pr-3 font-medium">{t("profile.historyBrowser")}</th>
                          <th className="py-2 pr-3 font-medium">{t("profile.historyOs")}</th>
                          <th className="py-2 pr-3 font-medium">{t("profile.historyDevice")}</th>
                          <th className="py-2 pr-3 font-medium">{t("profile.historyIp")}</th>
                          <th className="py-2 font-medium">{t("profile.historyStatus")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loginHistory.map((h) => (
                          <tr key={h._id} className="border-b border-gray-100">
                            <td className="py-2 pr-3 whitespace-nowrap text-gray-700">
                              {new Date(h.createdAt).toLocaleString()}
                            </td>
                            <td className="py-2 pr-3 capitalize text-gray-700">{h.browser}</td>
                            <td className="py-2 pr-3 capitalize text-gray-700">{h.os}</td>
                            <td className="py-2 pr-3 capitalize text-gray-700">{h.deviceType}</td>
                            <td className="py-2 pr-3 text-gray-700">{h.ip}</td>
                            <td className="py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  h.status === "success"
                                    ? "bg-green-100 text-green-700"
                                    : h.status === "blocked"
                                    ? "bg-red-100 text-red-700"
                                    : h.status === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {statusLabel(h.status)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {t("profile.viewApplications")}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  {t("profile.deleteAccount")}
                  <Trash2 className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("profile.deleteTitle")}
              </h3>
              <button onClick={() => setShowDeleteModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              {t("profile.deleteDescription")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                {t("profile.cancel")}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t("profile.deleting") : t("profile.deleteConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
