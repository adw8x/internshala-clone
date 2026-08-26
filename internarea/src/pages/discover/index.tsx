"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { selectuser } from "@/Feature/Userslice";
import api, { authHeaders } from "@/lib/api";
import { Search, UserPlus, Check, Clock, X, Users } from "lucide-react";
import { toast } from "react-toastify";

interface DiscoverUser {
  _id: string;
  name: string;
  email: string;
  photo: string;
  connectionStatus: "none" | "sent" | "received" | "connected" | "rejected";
}

interface PendingRequest {
  _id: string;
  sender: { _id: string; name: string; email: string; photo: string };
  receiver: { _id: string; name: string; email: string; photo: string };
  status: string;
  createdAt: string;
}

export default function DiscoverPage() {
  const user = useSelector(selectuser);
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"discover" | "requests">("discover");

  const fetchUsers = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.get("/connection/users", {
        params: { search },
        headers: authHeaders(user),
      });
      setUsers(res.data.users);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [user, search]);

  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/connection/list", {
        params: { type: "pending" },
        headers: authHeaders(user),
      });
      setPendingRequests(res.data.connections);
    } catch {
      toast.error("Failed to load requests");
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
    fetchPendingRequests();
  }, [fetchUsers, fetchPendingRequests]);

  useEffect(() => {
    const timer = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timer);
  }, [search, fetchUsers]);

  const handleSendRequest = async (userId: string) => {
    try {
      await api.post(
        "/connection/send",
        { receiverId: userId },
        { headers: authHeaders(user) }
      );
      toast.success("Request sent!");
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, connectionStatus: "sent" } : u
        )
      );
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to send request");
    }
  };

  const handleAccept = async (connectionId: string) => {
    try {
      await api.post(
        "/connection/accept",
        { connectionId },
        { headers: authHeaders(user) }
      );
      toast.success("Connection accepted!");
      setPendingRequests((prev) => prev.filter((r) => r._id !== connectionId));
      fetchUsers();
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleReject = async (connectionId: string) => {
    try {
      await api.post(
        "/connection/reject",
        { connectionId },
        { headers: authHeaders(user) }
      );
      toast.success("Request rejected");
      setPendingRequests((prev) => prev.filter((r) => r._id !== connectionId));
    } catch {
      toast.error("Failed to reject request");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Login to discover people
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to connect with other users
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Discover People
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("discover")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "discover"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Discover
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === "requests"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "discover" && (
          <>
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Users Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg shadow p-4 animate-pulse"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {search ? "Try a different search" : "No other users yet"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((u) => (
                  <div
                    key={u._id}
                    className="bg-white rounded-lg shadow p-4 flex flex-col"
                  >
                    <div className="flex items-center space-x-4 mb-4">
                      {u.photo ? (
                        <img
                          src={u.photo}
                          alt={u.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {(u.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {u.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-auto">
                      {u.connectionStatus === "none" ||
                      u.connectionStatus === "rejected" ? (
                        <button
                          onClick={() => handleSendRequest(u._id)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Connect</span>
                        </button>
                      ) : u.connectionStatus === "sent" ? (
                        <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg">
                          <Clock className="h-4 w-4" />
                          <span>Request Sent</span>
                        </div>
                      ) : u.connectionStatus === "received" ? (
                        <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-50 text-yellow-700 text-sm font-medium rounded-lg">
                          <span>Request Received</span>
                        </div>
                      ) : (
                        <div className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg">
                          <Check className="h-4 w-4" />
                          <span>Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "requests" && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pending requests
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  When someone sends you a connection request, it will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((req) => (
                  <div
                    key={req._id}
                    className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      {req.sender.photo ? (
                        <img
                          src={req.sender.photo}
                          alt={req.sender.name}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                          {(req.sender.name || "U").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {req.sender.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {req.sender.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleAccept(req._id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(req._id)}
                        className="px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-lg hover:bg-red-200 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
