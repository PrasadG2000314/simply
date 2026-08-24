"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme, useLanguage } from "../app/providers";
import { Globe, Sun, Moon, Menu, X, ShieldCheck, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = () => {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };
    checkUser();
    // Set up storage listener to sync login states across tabs
    window.addEventListener("storage", checkUser);
    return () => window.removeEventListener("storage", checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-black text-xl tracking-tight text-foreground group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all duration-300 group-hover:scale-105 shadow-md shadow-primary/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <span className="font-extrabold tracking-tight">
            Similar<span className="text-primary">fy</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/#samples-section" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Samples
          </Link>
          <Link href="/how-it-works" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            How It Works
          </Link>
          <Link href="/#pricing" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/blog" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Blog
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-4">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all cursor-pointer"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{language}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl border border-border bg-card p-1 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
                {(["English", "Sinhala", "Tamil"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted transition-colors ${
                      language === lang ? "text-primary bg-primary/10" : "text-foreground"
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle Theme"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {/* Auth Button */}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-all duration-200 shadow-md shadow-primary/10 hover:scale-[1.02]"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-all duration-200 shadow-md shadow-primary/10 hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl"
          >
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background px-6 py-6 space-y-4 animate-in slide-in-from-top duration-250">
          <nav className="flex flex-col gap-3 font-semibold text-sm">
            <Link
              href="/#samples-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Samples
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              About
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Blog
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Contact
            </Link>
          </nav>

          <hr className="border-border/40" />

          {/* Mobile Auth Options */}
          {user ? (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-muted-foreground px-3">
                Logged in as: <span className="text-foreground">{user.email}</span>
              </div>
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-2.5 text-sm font-bold hover:bg-red-500/15 transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
