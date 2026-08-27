"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Mail, Lock, Check, ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  useEffect(() => {
    const file = searchParams.get("file");
    if (file) {
      setTimeout(() => setPendingFile(file), 0);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Invalid email address or password.");
        return;
      }

      // Store token and user info
      localStorage.setItem("authToken", data.token);
      localStorage.setItem(
        "currentUser",
        JSON.stringify({ email: data.user.email, name: data.user.fullName, id: data.user.id })
      );
      window.dispatchEvent(new Event("storage"));

      const buy = searchParams.get("buy");
      const price = searchParams.get("price");
      if (buy && price) {
        router.push(`/dashboard?buy=${buy}&price=${price}`);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-6 py-12">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-border bg-card p-8 shadow-xl">
        {/* Header logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/logo.png"
              alt="TurniPass Logo"
              className="h-12 w-auto object-contain dark:hidden transition-transform group-hover:scale-105"
            />
            <img
              src="/logo-white.png"
              alt="TurniPass Logo"
              className="h-12 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105"
            />
          </Link>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight pt-2">
            Welcome back
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Log in to manage your scans and slots
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs text-muted-foreground font-semibold text-left space-y-1">
          <p className="font-bold text-primary flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Developer Premium Credentials</span>
          </p>
          <p>Email: <strong className="text-foreground">rnassignmentsolution@gmail.com</strong></p>
          <p>Password: <strong className="text-foreground">premium123</strong></p>
          <p className="text-[10px] text-muted-foreground/80 mt-1">Pre-loaded with 150 credits and mock historical scans.</p>
        </div>

        {pendingFile && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary font-bold flex items-center gap-2 leading-relaxed">
            <Check className="h-4 w-4 shrink-0" />
            <span>Log in to check: <strong>{pendingFile}</strong></span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-500 text-left">
            {error}
          </div>
        )}

        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.lk"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
              <a href="#" className="text-xs font-semibold text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/register${
                searchParams.toString() ? "?" + searchParams.toString() : ""
              }`}
              className="text-primary hover:underline font-bold"
            >
              Get Started
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>}>
      <LoginContent />
    </Suspense>
  );
}
