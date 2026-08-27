"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  FileText,
  Zap,
  CreditCard,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

type PackageTier = {
  name: string;
  credits: number;
  originalPrice: number;
  discountedPrice: number;
  perCreditPrice: number;
  discount: string;
  savings: number;
  popular?: boolean;
};

const standardPackages: PackageTier[] = [
  {
    name: "1 Credits",
    credits: 1,
    originalPrice: 1000,
    discountedPrice: 500,
    perCreditPrice: 500,
    discount: "20% OFF",
    savings: 500,
  },
  {
    name: "5 Credits",
    credits: 5,
    originalPrice: 4750,
    discountedPrice: 2500,
    perCreditPrice: 500,
    discount: "21% OFF",
    savings: 2250,
  },
  {
    name: "10 Credits",
    credits: 10,
    originalPrice: 9000,
    discountedPrice: 4500,
    perCreditPrice: 450,
    discount: "22% OFF",
    savings: 4500,
    popular: true,
  },
  {
    name: "Editor Elite",
    credits: 25,
    originalPrice: 21250,
    discountedPrice: 10000,
    perCreditPrice: 400,
    discount: "24% OFF",
    savings: 11250,
  },
  {
    name: "Department",
    credits: 50,
    originalPrice: 40000,
    discountedPrice: 17500,
    perCreditPrice: 350,
    discount: "25% OFF",
    savings: 22500,
  },
  {
    name: "Institution",
    credits: 100,
    originalPrice: 75000,
    discountedPrice: 30000,
    perCreditPrice: 300,
    discount: "27% OFF",
    savings: 45000,
  },
];

const apiPackages: PackageTier[] = [
  {
    name: "1 Credit",
    credits: 1,
    originalPrice: 1000,
    discountedPrice: 700,
    perCreditPrice: 700,
    discount: "20% OFF",
    savings: 300,
  },
  {
    name: "5 Credits",
    credits: 5,
    originalPrice: 4750,
    discountedPrice: 3500,
    perCreditPrice: 700,
    discount: "21% OFF",
    savings: 1250,
  },
  {
    name: "10 Credits",
    credits: 10,
    originalPrice: 9000,
    discountedPrice: 6500,
    perCreditPrice: 650,
    discount: "22% OFF",
    savings: 2500,
    popular: true,
  },
  {
    name: "Editor Elite",
    credits: 25,
    originalPrice: 21250,
    discountedPrice: 15000,
    perCreditPrice: 600,
    discount: "24% OFF",
    savings: 6250,
  },
  {
    name: "Department",
    credits: 50,
    originalPrice: 40000,
    discountedPrice: 27500,
    perCreditPrice: 550,
    discount: "25% OFF",
    savings: 12500,
  },
  {
    name: "Institution",
    credits: 100,
    originalPrice: 75000,
    discountedPrice: 50000,
    perCreditPrice: 500,
    discount: "27% OFF",
    savings: 25000,
  },
];

const features = [
  "Similarity + AI Detection Reports",
  "24h secure auto-deletion",
  "100% No-Repository Guaranteed",
  "Official Feedback Studio PDF",
  "Revision-Safe Scanning",
];

function fmt(n: number) {
  return `LKR ${n.toLocaleString("en-LK")}`;
}

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({ pkg, onBuy }: { pkg: PackageTier; onBuy: (p: PackageTier) => void }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
        pkg.popular
          ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
          : "border-border bg-card"
      }`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[10px] font-black text-primary-foreground uppercase tracking-wider shadow-md">
            <Sparkles className="h-3 w-3" />
            Most Popular
          </span>
        </div>
      )}

      {/* Package name label */}
      {pkg.name !== "1 Credit" &&
        pkg.name !== "5 Credits" &&
        pkg.name !== "10 Credits" && (
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">
            {pkg.name}
          </p>
        )}

      {/* Credits count */}
      <div className="flex items-baseline gap-1 mb-0.5">
        <span className="text-5xl font-black text-foreground tracking-tight leading-none">
          {pkg.credits}
        </span>
        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest self-end mb-1">
          Credits
        </span>
      </div>

      <p className="text-[10px] font-extrabold text-primary uppercase tracking-wider mb-4">
        Valid for 30 days only
      </p>

      {/* Pricing row */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-lg font-black text-foreground">{fmt(pkg.discountedPrice)}</span>
        <span className="text-xs text-muted-foreground line-through">{fmt(pkg.originalPrice)}</span>
        <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-black text-green-600">
          {pkg.discount}
        </span>
      </div>
      <p className="text-xs text-muted-foreground font-semibold mb-5">
        {fmt(pkg.perCreditPrice)} per credit
      </p>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-xs text-foreground font-semibold">
            <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>
              {f.startsWith("Similarity") ? `${pkg.credits} ${f}` : f}
            </span>
          </li>
        ))}
      </ul>

      {/* Savings badge */}
      <div className="rounded-xl bg-muted/40 border border-border px-3 py-2 mb-4 text-center">
        <p className="text-[10px] text-muted-foreground font-semibold">You save</p>
        <p className="text-sm font-black text-green-600">{fmt(pkg.savings)}</p>
      </div>

      {/* CTA */}
      <button
        id={`buy-${pkg.credits}-credits`}
        onClick={() => onBuy(pkg)}
        className={`w-full rounded-xl py-3 text-sm font-extrabold transition-all duration-200 hover:scale-[1.01] cursor-pointer ${
          pkg.popular
            ? "bg-primary text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20"
            : "border border-border bg-muted/30 text-foreground hover:bg-muted/60"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <CreditCard className="h-4 w-4" />
          Buy Plan
        </span>
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PackagesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"standard" | "api">("standard");

  const packages = activeTab === "standard" ? standardPackages : apiPackages;

  const handleBuy = (pkg: PackageTier) => {
    const user = localStorage.getItem("currentUser") || localStorage.getItem("token");
    if (!user) {
      router.push(
        `/auth/login?buy=${pkg.credits}&price=${pkg.discountedPrice}&name=${encodeURIComponent(pkg.name)}`
      );
      return;
    }
    router.push(`/dashboard?buy=${pkg.credits}&price=${pkg.discountedPrice}&name=${encodeURIComponent(pkg.name)}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-muted/15 py-12">
        <div className="mx-auto max-w-6xl px-6 space-y-10">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Hero header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-extrabold text-primary uppercase tracking-widest">
              <ShieldCheck className="h-3.5 w-3.5" />
              No-Repository Turnitin Scans
            </div>
            <h1 className="text-4xl font-black text-foreground tracking-tight">
              Choose Your Credit Package
            </h1>
            <p className="text-sm text-muted-foreground font-semibold max-w-xl mx-auto">
              Each credit unlocks one full Turnitin Similarity + AI Detection scan.
              Credits are valid for 30 days and are securely processed.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 pt-2">
              {[
                { icon: ShieldCheck, text: "100% No-Repository" },
                { icon: Clock, text: "24h Auto-Deletion" },
                { icon: FileText, text: "Official PDF Report" },
                { icon: Zap, text: "Instant Processing" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
                >
                  <Icon className="h-3.5 w-3.5 text-primary" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Tab switcher */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl border border-border bg-card p-1 gap-1">
              <button
                id="tab-standard"
                onClick={() => setActiveTab("standard")}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  activeTab === "standard"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Standard / Discounted
              </button>
              <button
                id="tab-api"
                onClick={() => setActiveTab("api")}
                className={`px-5 py-2 rounded-lg text-xs font-extrabold transition-all duration-200 cursor-pointer ${
                  activeTab === "api"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                API Tool
              </button>
            </div>
          </div>

          {/* Tab description */}
          <div className="text-center">
            {activeTab === "standard" ? (
              <p className="text-xs text-muted-foreground font-semibold">
                Best value for students, researchers, and academic writers.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground font-semibold">
                Optimized for developers and teams integrating via our API.
              </p>
            )}
          </div>

          {/* Package grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <PackageCard key={`${activeTab}-${pkg.credits}`} pkg={pkg} onBuy={handleBuy} />
            ))}
          </div>

          {/* Bottom trust note */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center space-y-1">
            <p className="text-xs font-extrabold text-foreground">
              🔒 Secure & Private
            </p>
            <p className="text-xs text-muted-foreground font-semibold max-w-lg mx-auto">
              All documents are auto-deleted within 24 hours after scanning. Your files never
              enter any repository database. Payments are processed securely.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
