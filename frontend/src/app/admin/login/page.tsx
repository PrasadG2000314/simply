"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, User, Lock, Loader2, AlertTriangle } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid credentials.");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.admin));
      router.push("/admin/dashboard");
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-6">
      {/* Subtle background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(to right, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-sm space-y-8">
        {/* Logo / header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30 mx-auto">
            <ShieldCheck className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Admin Portal
            </h1>
            <p className="text-xs text-zinc-500 font-semibold mt-1">
              Simply Platform · Restricted Access
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-400">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-3 text-sm text-white font-semibold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-10 pr-4 py-3 text-sm text-white font-semibold placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <button
              id="admin-login-submit"
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Sign In to Admin
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-zinc-600 font-semibold">
          Restricted area · Unauthorised access is prohibited
        </p>
      </div>
    </div>
  );
}
