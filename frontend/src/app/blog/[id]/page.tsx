"use client";

import React, { use, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BLOG_DATA: Record<string, { title: string; desc: string; date: string; readTime: string; tag: string; content: string[] }> = {
  "1": {
    title: "Understanding Your Turnitin Similarity Index Report",
    desc: "A detailed guide explaining what similarity percentages mean, how sources match, and how to tell the difference between overlap and actual plagiarism.",
    date: "July 12, 2026",
    readTime: "5 min read",
    tag: "Originality Guides",
    content: [
      "When Turnitin processes a document, it generates a 'Similarity Index' percentage. This index represents the percentage of text in the submission that matches text found in Turnitin's extensive databases of web pages, student papers, and academic publications.",
      "It is critical to understand that the similarity index is NOT a direct measure of plagiarism. Plagiarism is the ethical violation of passing off someone else's writing as your own. Turnitin simply highlights matching sequences of consecutive words.",
      "For instance, if your document includes a long, properly cited direct quote from a research source, Turnitin will highlight it and add it to the similarity score. This match is entirely ethical because you credited the author. Similarly, standard equations, bibliography reference listings, and common academic transitions naturally flag matches.",
      "We recommend reviewing the matching sources list in the sidebar. Focus on matching blocks that represent copy-pasted phrases without quotation marks, and restructure or paraphrase those sections to write a clean draft."
    ]
  },
  "2": {
    title: "Understanding Turnitin AI Detection Writing Percentages",
    desc: "Turnitin can flag text written by ChatGPT or Claude. Learn how the AI model predicts signatures and tips to resolve false positives in your work.",
    date: "July 08, 2026",
    readTime: "4 min read",
    tag: "AI Guidelines",
    content: [
      "Turnitin's AI Writing Detection tool operates by looking for predictable patterns in language. Unlike human writers who use dynamic sentence length and varied vocabulary, large language models (LLMs) like ChatGPT, Claude, and Gemini construct text based on statistical probabilities of word occurrences.",
      "The detector divides the text into segments and runs them through a classifier that evaluates predictability. If a segment's perplexity and burstiness signatures resemble AI generation patterns, the segment is highlighted in blue and the AI percentage score is increased.",
      "A common issue is the 'false positive' flag—where original human-written text is flagged as AI. This often happens if the writing style is highly structured, uses passive voice extensively, or uses standard formulas.",
      "If you face false-positive flags, keep your edit history. Word processors like Google Docs and Microsoft Word track changes over time, proving you wrote the draft step-by-step. Showing drafts, notes, and outlines to your instructor is also strong evidence."
    ]
  },
  "3": {
    title: "Why You Must Avoid Standard Assignment Repository Uploads",
    desc: "A look at standard repository indexing in universities like SLIIT or Kelaniya, and how submitting early drafts can trigger permanent indexing flags.",
    date: "June 28, 2026",
    readTime: "6 min read",
    tag: "No-Repository Guides",
    content: [
      "Many students check drafts on their university's Turnitin portal before submitting the final version. If the assignment is set to store documents in Turnitin's global database, the draft becomes permanently indexed.",
      "When you edit the draft and submit the final version, Turnitin compares it against its entire index. It will highlight the matches against your own previous draft, triggering a similarity score of nearly 100%.",
      "Resolving this requires the university administrator to delete the indexed draft manually, which is a slow and complex process.",
      "To prevent this, pre-submit checks should always be conducted strictly on assignment portals or external services configured in 'No-Repository' mode. TurniPass ensures this by using instructor licenses that never save files to the database."
    ]
  }
};

export default function BlogPost({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [post, setPost] = useState<typeof BLOG_DATA[string] | null>(null);

  useEffect(() => {
    const matched = BLOG_DATA[resolvedParams.id];
    if (matched) {
      setTimeout(() => setPost(matched), 0);
    } else {
      router.push("/blog");
    }
  }, [resolvedParams.id, router]);

  if (!post) {
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
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Guides</span>
          </Link>

          {/* Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-[10px] uppercase font-bold text-primary">
                {post.tag}
              </span>
              <span>{post.readTime}</span>
              <span>·</span>
              <span>{post.date}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight">
              {post.title}
            </h1>
            <p className="text-sm text-muted-foreground font-semibold leading-relaxed">
              {post.desc}
            </p>
          </div>

          <hr className="border-border/40" />

          {/* Article content */}
          <article className="space-y-6 text-sm sm:text-base text-muted-foreground leading-relaxed font-semibold">
            {post.content.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
