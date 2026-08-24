"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Mail, Lock, User, Check, ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
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

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms of Service.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please try again.");
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
          <Link href="/" className="flex items-center gap-2 font-black text-2xl tracking-tight text-foreground group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all shadow-md shadow-primary/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="font-extrabold tracking-tight">
              Similar<span className="text-primary">fy</span>
            </span>
          </Link>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight pt-2">
            Create your account
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Get instant access to No-Repository plagiarism scans
          </p>
        </div>

        {pendingFile && (
          <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 text-xs text-primary font-bold flex items-center gap-2 leading-relaxed">
            <Check className="h-4 w-4 shrink-0" />
            <span>Account creation required to check: <strong>{pendingFile}</strong></span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-500 text-left">
            {error}
          </div>
        )}

        <form className="space-y-4 text-left" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                <User className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Kasun Perera"
                className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

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
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Password</label>
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

          {/* Accept Terms */}
          <label className="flex items-center gap-2 cursor-pointer select-none py-1">
            <input
              type="checkbox"
              checked={acceptTerms}
              onChange={(e) => setAcceptTerms(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary h-4 w-4"
            />
            <span className="text-xs text-muted-foreground font-semibold">
              I agree to the{" "}
              <Link href="/legal/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.01] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Already have an account?{" "}
            <Link
              href={`/auth/login${
                searchParams.toString() ? "?" + searchParams.toString() : ""
              }`}
              className="text-primary hover:underline font-bold"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Register() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-muted/20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>}>
      <RegisterContent />
    </Suspense>
  );
}
