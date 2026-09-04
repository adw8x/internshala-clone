import { logout, selectuser } from "@/Feature/Userslice";
import { clearAdmin } from "@/lib/auth";
import { ExternalLink, Mail, Trash2, User, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/firebase";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import api, { authHeaders } from "@/lib/api";

const index = () => {
  const user = useSelector(selectuser);
  const dispatch = useDispatch();
  const router = useRouter();
  const [stats, setStats] = useState({ active: 0, accepted: 0 });
  const [friendCount, setFriendCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
      alert("Failed to delete account. Please try again.");
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
                    Active Applications
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <span className="text-green-600 font-semibold text-2xl">
                    {stats.accepted}
                  </span>
                  <p className="text-green-600 text-sm mt-1">
                    Accepted Applications
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <span className="text-purple-600 font-semibold text-2xl">
                    {friendCount}
                  </span>
                  <p className="text-purple-600 text-sm mt-1">
                    Connections
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-4">
                <Link
                  href="/userapplication"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  View Applications
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-white border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors duration-200"
                >
                  Delete Account
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
                Delete Account
              </h3>
              <button onClick={() => setShowDeleteModal(false)}>
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              This will permanently delete your account, all your posts, comments,
              connections, and applications. Your name and email will be freed up.
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default index;
