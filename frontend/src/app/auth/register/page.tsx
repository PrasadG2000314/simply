"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, Check, ArrowRight, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingFile, setPendingFile] = useState<string | null>(null);

  // OTP Verification Step State
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const file = searchParams.get("file");
    if (file) {
      setTimeout(() => setPendingFile(file), 0);
    }
  }, [searchParams]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Step 1: Send OTP to verify email
  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setInfoMessage("");

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (!acceptTerms) {
      setError("You must accept the Terms of Service.");
      return;
    }

    if (name.length < 3 || name.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(name)) {
      setError("Username can only contain letters, numbers, '.', '_', or '-'.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, fullName: name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to send verification code. Please try again.");
        return;
      }

      setStep("otp");
      setResendCooldown(45);
      setInfoMessage(`We've sent a 6-digit verification code to ${email}.`);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;
    setError("");
    setInfoMessage("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/send-register-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: name, fullName: name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to resend code.");
        return;
      }

      setResendCooldown(45);
      setInfoMessage(`A fresh verification code has been sent to ${email}.`);
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and complete registration
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          fullName: name,
          email,
          password,
          otp: cleanOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Registration failed. Please check the code and try again.");
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
      const pkgName = searchParams.get("name");
      if (buy && price) {
        router.push(`/dashboard?buy=${buy}&price=${price}${pkgName ? `&name=${encodeURIComponent(pkgName)}` : ""}`);
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
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-xl">
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
            {step === "form" ? "Create your account" : "Verify Your Email"}
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            {step === "form"
              ? "Get instant access to No-Repository plagiarism scans"
              : `Enter the 6-digit code sent to ${email}`}
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

        {infoMessage && (
          <div className="p-3.5 rounded-xl border border-green-500/20 bg-green-500/10 text-xs font-bold text-green-600 dark:text-green-400 text-left">
            {infoMessage}
          </div>
        )}

        {step === "form" ? (
          <form className="space-y-4 text-left" onSubmit={handleRequestOtp}>
            {/* Username */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))}
                  placeholder="john_doe"
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
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form className="space-y-5 text-left" onSubmit={handleVerifyOtp}>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setStep("form");
                    setOtp("");
                    setError("");
                    setInfoMessage("");
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Change Email
                </button>
              </div>

              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                placeholder="••••••"
                autoFocus
                className="w-full rounded-2xl border-2 border-border bg-background py-3.5 px-4 text-2xl font-black font-mono tracking-[0.6em] text-center text-foreground placeholder:tracking-widest focus:border-primary focus:outline-none transition-all shadow-inner"
              />
              <p className="text-[11px] text-muted-foreground text-center">
                Valid for 10 minutes. Check your inbox and spam folder.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 transition-all duration-200 hover:scale-[1.01] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Verifying Code...</span>
                </>
              ) : (
                <>
                  <span>Verify & Complete Registration</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0 || loading}
                className="text-xs font-bold text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendCooldown > 0 ? (
                  <span>Resend code in {resendCooldown}s</span>
                ) : (
                  <span className="text-primary hover:underline">Resend code</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setError("");
                  setInfoMessage("");
                }}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
              >
                Back to registration
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground font-semibold">
            Already have an account?{" "}
            <Link
              href={`/auth/login${searchParams.toString() ? "?" + searchParams.toString() : ""
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
