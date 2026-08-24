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
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  hasActiveToken: boolean;
}

interface Stats {
  totalUsers: number;
  newToday: number;
  newThisWeek: number;
}

function AdminDashboardContent() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [adminUser, setAdminUser] = useState<{ username: string } | null>(null);
  const [error, setError] = useState("");

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
      const [usersRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      // Handle expired/invalid token
      if (usersRes.status === 401 || statsRes.status === 401) {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
        return;
      }

      const usersData = await usersRes.json();
      const statsData = await statsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (statsData.success) setStats(statsData.stats);
    } catch {
      setError("Failed to fetch data. Check your connection.");
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

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
                Simply Admin
              </p>
              <p className="text-[10px] text-zinc-500 font-semibold">
                Control Panel · {adminUser?.username}
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Users,
              label: "Total Users",
              value: stats?.totalUsers ?? users.length,
              color: "text-primary",
              bg: "bg-primary/10",
            },
            {
              icon: UserPlus,
              label: "New Today",
              value: stats?.newToday ?? 0,
              color: "text-green-400",
              bg: "bg-green-500/10",
            },
            {
              icon: Activity,
              label: "New This Week",
              value: stats?.newThisWeek ?? 0,
              color: "text-blue-400",
              bg: "bg-blue-500/10",
            },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                  {label}
                </p>
                <p className="text-2xl font-black text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ─── Users Table ───────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden">
          {/* Table header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-black text-white">Registered Users</h2>
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-black text-primary">
                {filteredUsers.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                id="admin-search"
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-xl border border-zinc-700 bg-zinc-800 pl-9 pr-4 py-2 text-xs text-white font-semibold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
          </div>

          {/* Table */}
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
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Joined
                    </span>
                  </th>
                  <th className="px-6 py-3 text-left text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Users className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                      <p className="text-xs text-zinc-600 font-semibold">
                        {search ? "No users match your search." : "No registered users yet."}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
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

          {/* Footer */}
          {filteredUsers.length > 0 && (
            <div className="border-t border-zinc-800 px-6 py-3 flex items-center justify-between">
              <p className="text-[10px] text-zinc-600 font-semibold">
                Showing {filteredUsers.length} of {users.length} users
              </p>
              <p className="text-[10px] text-zinc-600 font-semibold">
                Simply Admin · Data from MongoDB
              </p>
            </div>
          )}
        </div>
      </main>
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
