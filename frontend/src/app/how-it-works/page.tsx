"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function HowItWorks() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-background text-left py-16">
        <div className="mx-auto max-w-4xl px-6 space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-block rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              System Guide
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
              How TurniPass Works
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-semibold max-w-2xl leading-relaxed">
              Learn how we route your documents through verified Turnitin® instructor accounts to provide genuine reports without leaving any database traces.
            </p>
          </div>

          <hr className="border-border/40" />

          {/* Core Steps */}
          <div className="space-y-8">
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              The 3-Step Process
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <div className="text-2xl font-black text-primary font-mono bg-primary/10 h-10 w-10 flex items-center justify-center rounded-xl">
                  1
                </div>
                <h3 className="font-extrabold text-base text-foreground leading-snug">Purchase Scan Balance</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Choose a scan slots pack (1 check, 5 checks, 10 checks, etc.) on our pricing table. Payments are securely authenticated and credit slots are immediately loaded.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <div className="text-2xl font-black text-primary font-mono bg-primary/10 h-10 w-10 flex items-center justify-center rounded-xl">
                  2
                </div>
                <h3 className="font-extrabold text-base text-foreground leading-snug">Upload Draft File</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  Log in to your dashboard and drop your PDF or DOCX file. The file is validated and prepared for secure API transmission.
                </p>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <div className="text-2xl font-black text-primary font-mono bg-primary/10 h-10 w-10 flex items-center justify-center rounded-xl">
                  3
                </div>
                <h3 className="font-extrabold text-base text-foreground leading-snug">Get Turnitin Reports</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                  The document is processed and results are generated (takes 5-30 minutes). Download your similarity index sheet and AI detection percentage report as standard PDFs.
                </p>
              </div>
            </div>
          </div>

          {/* Deep Dive Security */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-extrabold text-foreground tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Strict No-Repository Mode Explained
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              Turnitin provides multiple setup profiles for document submissions. Standard student submissions are set to &quot;Standard Repository,&quot; meaning Turnitin indexes the draft to match future uploads. TurniPass routes your uploads strictly through verified Instructor licenses set to **&quot;No-Repository&quot;**.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground font-bold">Revision-Safe checking</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Check drafts repeatedly. Edits will never flag against previous drafts as self-plagiarism.</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-background border border-border">
                <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-foreground font-bold">Auto-Delete in 24 hours</h4>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Uploads and reports are permanently deleted from our workspace logs exactly 24 hours after generation.</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQs section preview */}
          <div className="space-y-4 text-center">
            <h3 className="font-extrabold text-base text-foreground">Have more questions about slots or reports?</h3>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
            >
              <span>View Packages & Pricing</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
