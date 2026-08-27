"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, Heart, Users, Target } from "lucide-react";

export default function About() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-background text-left py-16">
        <div className="mx-auto max-w-4xl px-6 space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-block rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Who We Are
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
              About TurniPass
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-semibold max-w-2xl leading-relaxed">
              Empowering academic excellence and research integrity in Sri Lanka.
            </p>
          </div>

          <hr className="border-border/40" />

          {/* Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Our Mission
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                TurniPass was founded to bridge the gap between students and high-grade plagiarism detection systems. We believe every student, researcher, and academic writer deserves private, secure, and affordable access to pre-submission evaluations to protect their hard work.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Data Privacy & Security
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                We maintain strict ethical standards. We do not store your files permanently on our servers, nor do we sell your intellectual property. All documents are processed through verified Instructor systems and deleted automatically exactly 24 hours after.
              </p>
            </div>
          </div>

          {/* Pillars */}
          <div className="bg-muted/10 border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight text-center">
              Our Core Trust Pillars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">Student Focused</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">We support students across Colombo, Kelaniya, SLIIT, Peradeniya, and other local institutes.</p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">Secure Routing</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Guaranteed 100% No-Repository scans to prevent self-plagiarism flags.</p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Heart className="h-5 w-5" />
                </div>
                <h4 className="font-extrabold text-sm text-foreground">Local Checkout</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">Integrated local Sri Lankan checkout rates with instant confirm confirmations.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
