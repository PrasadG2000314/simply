import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turnitin Checker Sri Lanka | Official Similarity & AI Reports (No Repository) — Similarfy",
  description: "Official Turnitin Similarity + AI reports in Sri Lanka. No-repository mode, results in minutes. Private pre-submission checks — never saved to the Turnitin database.",
  keywords: ["Turnitin checker Sri Lanka", "Turnitin Sri Lanka", "Turnitin no repository", "Turnitin AI detection", "Turnitin similarity report", "plagiarism check Sri Lanka"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-LK"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
