"use client";

import React, { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LEGAL_DATA: Record<string, { title: string; lastUpdated: string; sections: { heading: string; paragraphs: string[] }[] }> = {
  terms: {
    title: "Terms of Service",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        paragraphs: [
          "By accessing similarfy.com ('the Service'), you agree to be bound by these Terms of Service. If you do not agree, you are prohibited from utilizing any services or downloading files from the platform.",
          "We reserve the right to edit or update these terms at any time without notice. Your continued use of Similarfy constitutes acceptance of modified guidelines."
        ]
      },
      {
        heading: "2. Description of Service",
        paragraphs: [
          "Similarfy provides an automated routing gateway to check documents for matching text (Similarity Index) and AI writing probability using Turnitin® Backends in strict No-Repository mode.",
          "We sell 'scan credits' (slots) on a pay-as-you-go basis. One credit allows a single document upload and returns one similarity and one AI report sheet."
        ]
      },
      {
        heading: "3. Refund and Credit Policy",
        paragraphs: [
          "If a system failure, API disruption, or format error prevents report generation, the credit is automatically returned to your workspace balance.",
          "All purchased credits expire after 30 days from the top-up date."
        ]
      }
    ]
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Data Collection & Processing",
        paragraphs: [
          "We process your documents strictly for generating plagiarism and AI checks. Because we route files in No-Repository mode, files are never indexed or stored in the database.",
          "We gather basic credentials (email, name) during account registration to manage your slot balances."
        ]
      },
      {
        heading: "2. 24-Hour File Auto-Delete",
        paragraphs: [
          "To guarantee absolute student privacy, we enforce a strict auto-delete policy. All uploaded papers and generated reports are permanently scrubbed from our systems exactly 24 hours after submission."
        ]
      },
      {
        heading: "3. Cookies and Analytics",
        paragraphs: [
          "We use necessary browser cookies to keep you signed in to your dashboard and preserve your configuration options."
        ]
      }
    ]
  },
  refund: {
    title: "Refund & Credit Guarantee",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Credit Guarantee",
        paragraphs: [
          "We guarantee that a scan slot is only spent when a verified, readable originality report is generated. If your scan fails due to formatting, network drops, or system timeouts, the slot is immediately re-credited to your account."
        ]
      },
      {
        heading: "2. Payment Refunds",
        paragraphs: [
          "Since our slots are consumable, payment refunds are evaluated case-by-case. Please submit a support ticket via our contact page to request a review."
        ]
      }
    ]
  },
  cookies: {
    title: "Cookie Declaration",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Use of Cookies",
        paragraphs: [
          "We use essential cookies to maintain user sessions, handle light/dark mode selection, and ensure payment checkout states remain secure."
        ]
      }
    ]
  },
  dpa: {
    title: "Data Processing Addendum",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Scope and Subject Matter",
        paragraphs: [
          "This addendum defines data processing standards for students, academic departments, and organizations uploading content to Similarfy.",
          "Similarfy acts as a data processor, routing content through secure API channels to Turnitin node points without local persistence."
        ]
      }
    ]
  },
  security: {
    title: "Security Operations",
    lastUpdated: "July 01, 2026",
    sections: [
      {
        heading: "1. Security Infrastructure",
        paragraphs: [
          "Our system endpoints utilize SSL encryption for all file transfers. Database clusters are hosted in secure local zones, and auto-delete protocols run on automated cron jobs."
        ]
      }
    ]
  }
};

export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [doc, setDoc] = useState<typeof LEGAL_DATA[string] | null>(null);

  useEffect(() => {
    const matched = LEGAL_DATA[resolvedParams.slug];
    if (matched) {
      setTimeout(() => setDoc(matched), 0);
    } else {
      router.push("/");
    }
  }, [resolvedParams.slug, router]);

  if (!doc) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-background text-left py-16">
        <div className="mx-auto max-w-3xl px-6 space-y-8">
          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>

          {/* Header */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Legal Document</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight leading-none">
              {doc.title}
            </h1>
            <p className="text-xs text-muted-foreground font-mono font-bold">
              Last Updated: {doc.lastUpdated}
            </p>
          </div>

          <hr className="border-border/40" />

          {/* Sections */}
          <div className="space-y-8">
            {doc.sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-lg font-extrabold text-foreground tracking-tight">
                  {section.heading}
                </h2>
                <div className="space-y-3.5 text-sm sm:text-base text-muted-foreground font-semibold leading-relaxed">
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx}>{p}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
