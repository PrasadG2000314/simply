"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Users,
  LogOut,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Activity,
  Calendar,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Coins,
  Check,
  AlertCircle,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  credits: number;
  createdAt: string;
  hasActiveToken: boolean;
}

interface PaymentSlipRecord {
  _id?: string;
  id?: string;
  userId?: string;
  userName: string;
  userEmail: string;
  packageName: string;
  credits: number;
  amount: number;
  slipImage: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

interface Stats {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
  pendingSlips: number;
}

function AdminDashboardContent() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [slips, setSlips] = useState<PaymentSlipRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"slips" | "users">("slips");
  const [slipFilter, setSlipFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
  const [error, setError] = useState("");

  // Slip preview Lightbox modal
  const [activeSlipModal, setActiveSlipModal] = useState<PaymentSlipRecord | null>(null);
  // Action loading state
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [targetRejectSlip, setTargetRejectSlip] = useState<PaymentSlipRecord | null>(null);

  const getToken = () => localStorage.getItem("adminToken");

  const fetchData = async (isRefresh = false) => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const [usersRes, statsRes, slipsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/slips`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.status === 401 || statsRes.status === 401 || slipsRes.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();
      const slipsData = await slipsRes.json();

      let fetchedSlips: PaymentSlipRecord[] = [];
      if (slipsData.success) fetchedSlips = slipsData.slips;

      // Merge with local storage slips if any
      const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
      const combinedSlips = [...fetchedSlips];

      localSlips.forEach((ls) => {
        const id = ls._id || ls.id;
        if (!combinedSlips.some((s) => (s._id || s.id) === id)) {
          combinedSlips.push(ls);
        }
      });

      if (usersData.success) setUsers(usersData.users);
      setSlips(combinedSlips);

      const pendingCount = combinedSlips.filter((s) => s.status === "pending").length;
      if (statsData.success) {
        setStats({ ...statsData.stats, pendingSlips: pendingCount });
      }
    } catch {
      setError("Failed to fetch admin data. Please check your network connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/admin/login");
      return;
    }
    const stored = localStorage.getItem("adminUser");
    if (stored) setAdminUser(JSON.parse(stored));
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.push("/admin/login");
  };

  // Approve Payment Slip
  const handleApproveSlip = async (slip: PaymentSlipRecord) => {
    const token = getToken();
    const targetId = slip._id || slip.id;

    if (!confirm(`Are you sure you want to approve this slip? This will credit ${slip.credits} coins to ${slip.userName}.`)) {
      return;
    }

    if (targetId) setActionLoadingId(targetId);

    // Sync local storage state
    const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
    const updatedLocalSlips = localSlips.map((s) => {
      if ((s._id || s.id) === targetId) {
        return { ...s, status: "approved" as const };
      }
      return s;
    });
    localStorage.setItem("paymentSlips", JSON.stringify(updatedLocalSlips));

    // Update registered user credits in local storage
    if (slip.userEmail) {
      const allUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
      if (allUsers[slip.userEmail]) {
        allUsers[slip.userEmail].credits = (allUsers[slip.userEmail].credits || 0) + slip.credits;
        localStorage.setItem("registeredUsers", JSON.stringify(allUsers));
      }
    }

    if (token && slip._id) {
      try {
        const res = await fetch(`${API_URL}/admin/slips/${slip._id}/approve`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        await res.json();
      } catch (err) {
        console.error("API approve error:", err);
      }
    }

    alert(`Approved! ${slip.credits} coins added to ${slip.userName}.`);
    if (activeSlipModal && (activeSlipModal._id === targetId || activeSlipModal.id === targetId)) {
      setActiveSlipModal(null);
    }
    setActionLoadingId(null);
    fetchData(true);
  };

  // Reject Payment Slip
  const handleOpenRejectModal = (slip: PaymentSlipRecord) => {
    setTargetRejectSlip(slip);
    setRejectNote("");
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!targetRejectSlip) return;
    const token = getToken();
    const targetId = targetRejectSlip._id || targetRejectSlip.id;

    if (targetId) setActionLoadingId(targetId);

    // Sync local storage
    const localSlips: PaymentSlipRecord[] = JSON.parse(localStorage.getItem("paymentSlips") || "[]");
    const updatedLocalSlips = localSlips.map((s) => {
      if ((s._id || s.id) === targetId) {
        return { ...s, status: "rejected" as const, adminNote: rejectNote };
      }
      return s;
    });
    localStorage.setItem("paymentSlips", JSON.stringify(updatedLocalSlips));

    if (token && targetRejectSlip._id) {
      try {
        const res = await fetch(`${API_URL}/admin/slips/${targetRejectSlip._id}/reject`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ adminNote: rejectNote }),
        });
        await res.json();
      } catch (err) {
        console.error("API reject error:", err);
      }
    }

    alert("Payment slip rejected.");
    setIsRejectModalOpen(false);
    setTargetRejectSlip(null);
    if (activeSlipModal && (activeSlipModal._id === targetId || activeSlipModal.id === targetId)) {
      setActiveSlipModal(null);
    }
    setActionLoadingId(null);
    fetchData(true);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSlips = slips.filter((s) => {
    const matchStatus = slipFilter === "all" ? true : s.status === slipFilter;
    const matchSearch =
      s.userName.toLowerCase().includes(search.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.packageName.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = slips.filter((s) => s.status === "pending").length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="text-center space-y-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-xs text-zinc-500 font-semibold">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* ─── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="border-b border-zinc-800 bg-zinc-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <ShieldCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-black text-white tracking-tight">
                Simply Admin Panel
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold">
                Control Center · {adminUser?.username}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="admin-refresh"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              id="admin-logout"
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400">
            {error}
          </div>
        )}

        {/* ─── Stats Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div
            onClick={() => {
              setActiveTab("slips");
              setSlipFilter("pending");
            }}
            className={`rounded-2xl border p-5 flex items-center gap-4 cursor-pointer transition-all ${
              pendingCount > 0
                ? "border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/5 hover:border-amber-500/60"
                : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
            }`}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">
                Pending Approvals
              </p>
              <p className="text-2xl font-black text-amber-400">{pendingCount}</p>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("users")}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4 cursor-pointer hover:border-zinc-700 transition-all"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                Total Users
              </p>
              <p className="text-2xl font-black text-white">{stats?.totalUsers ?? users.length}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 text-green-400">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                New Today
              </p>
              <p className="text-2xl font-black text-white">{stats?.newToday ?? 0}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                New This Week
              </p>
              <p className="text-2xl font-black text-white">{stats?.newThisWeek ?? 0}</p>
            </div>
          </div>
        </div>

        {/* ─── Navigation Tabs & Controls ────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("slips")}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "slips"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Bank Slip Approvals
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-500 px-2 py-0.2 text-[10px] font-black text-black">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
                activeTab === "users"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Users className="h-4 w-4" />
              Registered Users
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
            <input
              id="admin-search"
              type="text"
              placeholder={activeTab === "slips" ? "Search by user or package..." : "Search by name or email..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-9 pr-4 py-2 text-xs text-white font-semibold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* ─── TAB 1: Payment Slip Approvals ─────────────────────────────────── */}
        {activeTab === "slips" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden space-y-4">
            {/* Filter buttons */}
            <div className="flex items-center justify-between px-6 pt-4">
              <div className="flex items-center gap-1.5">
                {(["pending", "approved", "rejected", "all"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSlipFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold capitalize transition-all cursor-pointer ${
                      slipFilter === st
                        ? "bg-zinc-800 text-white border border-zinc-700"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {st === "all" ? "All Slips" : st}
                  </button>
                ))}
              </div>
              <span className="text-xs text-zinc-500 font-semibold">
                Showing {filteredSlips.length} payment slips
              </span>
            </div>

            {/* Slips table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Customer Details
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Package & Price
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Coins
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Payment Slip Image
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Submitted Date
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Action / Approval
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredSlips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Building2 className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600 font-semibold">
                          No payment slips found matching this filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredSlips.map((slip) => (
                      <tr key={slip._id} className="hover:bg-zinc-800/40 transition-colors">
                        {/* Customer */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-xs font-bold text-white">{slip.userName}</p>
                            <p className="text-[11px] text-zinc-400 font-medium">{slip.userEmail}</p>
                          </div>
                        </td>
                        {/* Package */}
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-xs font-bold text-white">{slip.packageName}</p>
                            <p className="text-[11px] font-extrabold text-primary">
                              LKR {slip.amount.toLocaleString("en-LK")}
                            </p>
                          </div>
                        </td>
                        {/* Coins */}
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs font-black text-primary">
                            <Coins className="h-3.5 w-3.5" />
                            +{slip.credits} Coins
                          </span>
                        </td>
                        {/* Slip Image */}
                        <td className="px-6 py-4 text-center">
                          <div
                            onClick={() => setActiveSlipModal(slip)}
                            className="inline-flex flex-col items-center gap-1 cursor-pointer group"
                          >
                            <img
                              src={slip.slipImage}
                              alt="Slip thumbnail"
                              className="h-10 w-10 object-cover rounded-lg border border-zinc-700 group-hover:border-primary transition-all"
                            />
                            <span className="text-[10px] font-bold text-primary group-hover:underline flex items-center gap-0.5">
                              <Eye className="h-3 w-3" /> View Slip
                            </span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-6 py-4 text-center">
                          {slip.status === "pending" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 text-[10px] font-black text-amber-400">
                              <Clock className="h-3 w-3" />
                              Pending Verification
                            </span>
                          )}
                          {slip.status === "approved" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 border border-green-500/20 px-2.5 py-1 text-[10px] font-black text-green-400">
                              <CheckCircle className="h-3 w-3" />
                              Approved
                            </span>
                          )}
                          {slip.status === "rejected" && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/20 px-2.5 py-1 text-[10px] font-black text-red-400"
                              title={slip.adminNote}
                            >
                              <XCircle className="h-3 w-3" />
                              Rejected
                            </span>
                          )}
                        </td>
                        {/* Submitted Date */}
                        <td className="px-6 py-4 text-xs text-zinc-500 font-semibold">
                          {formatDate(slip.createdAt)}
                        </td>
                        {/* Action buttons */}
                        <td className="px-6 py-4 text-right">
                          {slip.status === "pending" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveSlip(slip)}
                                disabled={actionLoadingId === slip._id}
                                className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-black text-white hover:bg-green-500 transition-all cursor-pointer shadow-md disabled:opacity-50"
                              >
                                {actionLoadingId === slip._id ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenRejectModal(slip)}
                                disabled={actionLoadingId === slip._id}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-black text-red-400 hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-bold text-zinc-600 italic">
                              Completed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── TAB 2: Registered Users ────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-black text-white">Registered Customer Accounts</h2>
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                  {filteredUsers.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Full Name
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Email Address
                    </th>
                    <th className="px-6 py-3 text-center text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Available Coins
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                      Session Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Users className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600 font-semibold">
                          {search ? "No users match your search." : "No registered users yet."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                        <td className="px-6 py-4 text-xs text-zinc-600 font-bold">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-black shrink-0">
                              {user.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-bold text-white">
                              {user.fullName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400 font-semibold">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-black text-primary">
                            <Coins className="h-3.5 w-3.5" />
                            {user.credits || 0} Coins
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-500 font-semibold">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {user.hasActiveToken ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-[10px] font-black text-green-400">
                              <UserCheck className="h-3 w-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-700/50 px-2.5 py-1 text-[10px] font-black text-zinc-500">
                              Logged out
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ─── Slip Lightbox Modal ────────────────────────────────────────────── */}
      {activeSlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-5 relative shadow-2xl">
            <button
              onClick={() => setActiveSlipModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Payment Slip Verification
              </h3>
              <p className="text-xs text-zinc-400 font-semibold">
                Customer: <span className="text-white font-bold">{activeSlipModal.userName}</span> ({activeSlipModal.userEmail})
              </p>
            </div>

            {/* Slip details summary */}
            <div className="grid grid-cols-3 gap-3 p-3 bg-zinc-800/60 border border-zinc-700/60 rounded-2xl text-xs">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Selected Plan</p>
                <p className="font-extrabold text-white">{activeSlipModal.packageName}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Coins to Credit</p>
                <p className="font-black text-primary">+{activeSlipModal.credits} Coins</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Amount</p>
                <p className="font-bold text-white">LKR {activeSlipModal.amount.toLocaleString("en-LK")}</p>
              </div>
            </div>

            {/* Full Slip Image */}
            <div className="max-h-[60vh] overflow-auto rounded-xl border border-zinc-800 bg-black p-2">
              <img
                src={activeSlipModal.slipImage}
                alt="Full Slip Receipt"
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            </div>

            {/* Actions inside modal */}
            {activeSlipModal.status === "pending" && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleOpenRejectModal(activeSlipModal)}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-black text-red-400 hover:bg-red-500/20 cursor-pointer"
                >
                  Reject Slip
                </button>
                <button
                  onClick={() => handleApproveSlip(activeSlipModal)}
                  disabled={actionLoadingId === activeSlipModal._id}
                  className="rounded-xl bg-green-600 px-5 py-2 text-xs font-black text-white hover:bg-green-500 cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
                >
                  {actionLoadingId === activeSlipModal._id && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  Approve & Credit Coins
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Reject Slip Reason Modal ──────────────────────────────────────── */}
      {isRejectModalOpen && targetRejectSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 relative shadow-2xl">
            <button
              onClick={() => {
                setIsRejectModalOpen(false);
                setTargetRejectSlip(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              Reject Payment Slip
            </h4>

            <p className="text-xs text-zinc-400 font-semibold">
              Please enter an optional reason for rejecting the payment slip of <span className="text-white font-bold">{targetRejectSlip.userName}</span>:
            </p>

            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="e.g. Reference number not matching, unreadable slip image..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-xs text-white font-semibold placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500/50"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setIsRejectModalOpen(false);
                  setTargetRejectSlip(null);
                }}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-bold text-zinc-300 hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={actionLoadingId === targetRejectSlip._id}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-500 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {actionLoadingId === targetRejectSlip._id && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <AdminDashboardContent />
    </Suspense>
  );
}
