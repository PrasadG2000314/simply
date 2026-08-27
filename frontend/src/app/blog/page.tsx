"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, Clock, Tag } from "lucide-react";
import Link from "next/link";

const BLOG_POSTS = [
  {
    id: "1",
    title: "Understanding Your Turnitin Similarity Index Report",
    desc: "A detailed guide explaining what similarity percentages mean, how sources match, and how to tell the difference between overlap and actual plagiarism.",
    date: "July 12, 2026",
    readTime: "5 min read",
    tag: "Originality Guides",
  },
  {
    id: "2",
    title: "Understanding Turnitin AI Detection Writing Percentages",
    desc: "Turnitin can flag text written by ChatGPT or Claude. Learn how the AI model predicts signatures and tips to resolve false positives in your work.",
    date: "July 08, 2026",
    readTime: "4 min read",
    tag: "AI Guidelines",
  },
  {
    id: "3",
    title: "Why You Must Avoid Standard Assignment Repository Uploads",
    desc: "A look at standard repository indexing in universities like SLIIT or Kelaniya, and how submitting early drafts can trigger permanent indexing flags.",
    date: "June 28, 2026",
    readTime: "6 min read",
    tag: "No-Repository Guides",
  },
];

export default function Blog() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 bg-background text-left py-10 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-10 sm:space-y-12">
          {/* Header */}
          <div className="space-y-4">
            <span className="inline-block rounded-xl bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Resource Center
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none">
              Academic Guides & Blog
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground font-semibold max-w-2xl leading-relaxed">
              Explore resources compiled by academic editors to help you interpret Turnitin scores and maintain high writing standards.
            </p>
          </div>

          <hr className="border-border/40" />

          {/* Posts grid */}
          <div className="grid grid-cols-1 gap-6">
            {BLOG_POSTS.map((post) => (
              <div key={post.id} className="bg-card border border-border rounded-2xl p-6 sm:p-8 hover:border-primary/20 transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
                    <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold text-primary">
                      <Tag className="h-3 w-3" /> {post.tag}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </span>
                    <span>·</span>
                    <span>{post.date}</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight hover:text-primary transition-colors cursor-pointer">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed font-semibold">
                    {post.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/blog/${post.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
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
