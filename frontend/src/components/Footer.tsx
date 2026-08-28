"use client";

import React from "react";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/40 bg-card py-16 text-muted-foreground">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <img
                src="/logo.png"
                alt="TurniPass Logo"
                className="h-10 md:h-12 w-auto object-contain dark:hidden transition-transform group-hover:scale-105"
              />
              <img
                src="/logo-white.png"
                alt="TurniPass Logo"
                className="h-10 md:h-12 w-auto object-contain hidden dark:block transition-transform group-hover:scale-105"
              />
            </Link>
            <p className="text-sm leading-relaxed font-medium">
              Official Turnitin Similarity and AI reports for students and researchers in Sri Lanka. 100% private, pre-submission checks strictly in No-Repository mode.
            </p>
            <div className="flex flex-col gap-2 pt-2 text-sm font-semibold">
              <a href="mailto:rnassignmentsolution@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                <span>rnassignmentsolution@gmail.com</span>
              </a>
            </div>
            {/* Socials */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://www.facebook.com/TurniPass/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 hover:border-foreground hover:bg-foreground hover:text-background text-muted-foreground transition-all"
                aria-label="Facebook"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a
                href="https://wa.me/94717376450"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 hover:border-foreground hover:bg-foreground hover:text-background text-muted-foreground transition-all"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Product
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li>
                <Link href="/about" className="hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="hover:text-foreground transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-foreground transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  Contact Helpdesk
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-foreground transition-colors">
                  Resources & Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Trust & Legal
            </h4>
            <ul className="space-y-2.5 text-sm font-semibold">
              <li>
                <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/legal/refund" className="hover:text-foreground transition-colors">
                  Refund & Credit Guarantee
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-foreground transition-colors">
                  Cookie Declaration
                </Link>
              </li>
              <li>
                <Link href="/legal/dpa" className="hover:text-foreground transition-colors">
                  Data Processing Addendum
                </Link>
              </li>
              <li>
                <Link href="/legal/security" className="hover:text-foreground transition-colors">
                  Security Operations
                </Link>
              </li>
            </ul>
          </div>

          {/* Tags Col */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Popular Tags
            </h4>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <Link href="/#pricing" className="rounded-full border border-border/80 bg-background px-3 py-1 hover:border-foreground/30 hover:text-foreground transition-all">
                Turnitin Price Sri Lanka
              </Link>
              <Link href="/how-it-works" className="rounded-full border border-border/80 bg-background px-3 py-1 hover:border-foreground/30 hover:text-foreground transition-all">
                Turnitin No Repository
              </Link>
              <Link href="/" className="rounded-full border border-border/80 bg-background px-3 py-1 hover:border-foreground/30 hover:text-foreground transition-all">
                Turnitin Checker Colombo
              </Link>
              <Link href="/about" className="rounded-full border border-border/80 bg-background px-3 py-1 hover:border-foreground/30 hover:text-foreground transition-all">
                AI Detection Check
              </Link>
              <Link href="/contact" className="rounded-full border border-border/80 bg-background px-3 py-1 hover:border-foreground/30 hover:text-foreground transition-all">
                University Plagiarism
              </Link>
            </div>
          </div>
        </div>

        <hr className="border-border/40 my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold">
          <p>© {new Date().getFullYear()} TurniPass.com. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Designed by Source Code
          </p>
        </div>
      </div>
    </footer>
  );
}
