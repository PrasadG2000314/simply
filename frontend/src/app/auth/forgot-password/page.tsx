"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Send } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Please enter your registered email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      if (data.devResetUrl) {
        setDevResetUrl(data.devResetUrl);
      }
    } catch {
      setError("Unable to connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-xl">
        {/* Header Logo */}
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
            Forgot Password?
          </h2>
          <p className="text-xs text-muted-foreground font-semibold max-w-xs">
            Enter your email and we'll send you a secure link to reset your account password.
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/10 text-xs font-bold text-red-500 flex items-start gap-2 text-left">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success View */}
        {success ? (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-bold text-foreground">Check Your Email</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                If an account exists with <strong className="text-foreground">{email}</strong>, we have sent a password reset link to your inbox.
              </p>
              <p className="text-[11px] text-muted-foreground/80 pt-1">
                Be sure to check your <strong>Spam or Junk</strong> folder if you do not receive it in a few minutes.
              </p>
            </div>

            {/* Dev shortcut when testing locally */}
            {devResetUrl && (
              <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 text-left space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500">
                  Local Dev Shortcut
                </span>
                <p className="text-xs text-muted-foreground break-all">
                  <a href={devResetUrl} className="text-blue-500 underline font-semibold">
                    Open Reset Page directly &rarr;
                  </a>
                </p>
              </div>
            )}

            <div className="pt-2">
              <Link
                href="/auth/login"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          /* Request Reset Form */
          <form className="space-y-5 text-left" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
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
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
