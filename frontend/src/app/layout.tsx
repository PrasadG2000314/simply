import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Turnitin Checker Sri Lanka | Official Similarity & AI Reports (No Repository) — TurniPass",
  description: "Official Turnitin Similarity + AI reports in Sri Lanka. No-repository mode, results in minutes. Private pre-submission checks — never saved to the Turnitin database.",
  keywords: ["TurniPass", "Turnitin checker Sri Lanka", "Turnitin Sri Lanka", "Turnitin no repository", "Turnitin AI detection", "Turnitin similarity report", "plagiarism check Sri Lanka"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-LK"
      className="h-full antialiased font-sans"
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
