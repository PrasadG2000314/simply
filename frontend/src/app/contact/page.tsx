"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { MessageSquare, Mail, HelpCircle, Send, Check, AlertCircle, X } from "lucide-react";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setAlertDialog({
        isOpen: true,
        title: "Required Fields Missing",
        message: "Please fill in all required fields (Name, Email, and Message).",
      });
      return;
    }
    setSuccess(true);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
    setTimeout(() => {
      setSuccess(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-background text-left py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-10 sm:space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-block rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Support Desk
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
              Contact TurniPass
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-semibold max-w-2xl leading-relaxed">
              Have questions about billing, reports, or data privacy? Send us a ticket and our support team will respond within 2-4 hours.
            </p>
          </div>

          <hr className="border-border/40" />

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Left form */}
            <div className="md:col-span-7 bg-card border border-border p-6 sm:p-8 rounded-2xl space-y-6">
              <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                Submit a Support Ticket
              </h2>

              {success && (
                <div className="p-3.5 bg-primary/10 border border-primary/20 text-xs font-bold text-primary rounded-xl flex items-center gap-2">
                  <Check className="h-4.5 w-4.5 shrink-0" />
                  <span>Ticket submitted successfully! We&apos;ll reply to your email shortly.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 font-semibold text-muted-foreground text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="uppercase tracking-wider">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Kasun Perera"
                      className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="uppercase tracking-wider">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.lk"
                      className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Billing / Scan failed / General query"
                    className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="uppercase tracking-wider">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Provide details about your query..."
                    className="w-full text-sm font-semibold text-foreground bg-background border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground hover:bg-primary/95 shadow-md shadow-primary/20 transition-all duration-200 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Ticket</span>
                </button>
              </form>
            </div>

            {/* Right Info info */}
            <div className="md:col-span-5 space-y-6 text-left">
              <div className="bg-muted/10 border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-sm text-foreground">Immediate Helpdesk</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  Check out these resources for common questions before submitting a ticket:
                </p>
                <div className="space-y-2 text-xs font-bold text-primary">
                  <Link href="/how-it-works" className="flex items-center gap-2 hover:underline">
                    <HelpCircle className="h-4 w-4 shrink-0" />
                    <span>How standard scans work</span>
                  </Link>
                  <Link href="/#pricing" className="flex items-center gap-2 hover:underline">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>Understanding credits & slot pricing</span>
                  </Link>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-sm text-foreground">Direct Contacts</h3>
                <div className="space-y-3.5 text-xs text-muted-foreground font-semibold">
                  <div className="flex items-center gap-2.5">
                    <Mail className="h-4.5 w-4.5 text-primary shrink-0" />
                    <div>
                      <p className="text-foreground font-bold">Email Support</p>
                      <a href="mailto:rnassignmentsolution@gmail.com" className="hover:underline text-[11px]">rnassignmentsolution@gmail.com</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="h-4.5 w-4.5 text-primary shrink-0" />
                    <div>
                      <p className="text-foreground font-bold">WhatsApp Hotline</p>
                      <a href="https://wa.me/94717376450" target="_blank" rel="noopener noreferrer" className="hover:underline text-[11px]">+94 71 737 6450</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Theme-Styled Alert Popup Modal ───────────────── */}
      {alertDialog.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 space-y-5 relative shadow-2xl scale-100 transition-all">
            <button
              onClick={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-amber-500/10 border-amber-500/20 text-amber-400">
                <AlertCircle className="h-6 w-6" />
              </div>

              <div className="space-y-1 pr-6 min-w-0">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  {alertDialog.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">
                  {alertDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => setAlertDialog((prev) => ({ ...prev, isOpen: false }))}
                className="w-full sm:w-auto rounded-xl px-5 py-2.5 text-xs font-black bg-[#fe9a00] text-black hover:bg-[#e08800] transition-all shadow-lg shadow-[#fe9a00]/20 cursor-pointer"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
