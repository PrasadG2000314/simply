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
        <Link href="/" className="flex items-center gap-2 group">
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
                className="inline-flex items-center gap-1.5 justify-center rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff7700] px-4 py-2 text-sm font-bold text-white transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(254,154,0,0.4)] hover:shadow-[0_6px_25px_-2px_rgba(254,154,0,0.55)] hover:scale-[1.03]"
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
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff7700] px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 shadow-[0_4px_20px_-3px_rgba(254,154,0,0.4)] hover:shadow-[0_6px_25px_-2px_rgba(254,154,0,0.55)] hover:scale-[1.03] active:scale-[0.98]"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle & Quick Actions */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2">
          {/* Mobile Language Selector */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all cursor-pointer"
              aria-label="Change Language"
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-[11px] font-bold uppercase">{language.slice(0, 3)}</span>
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-32 rounded-xl border border-border bg-card p-1 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {(["English", "Sinhala", "Tamil"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLanguage(lang);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg hover:bg-muted transition-colors ${
                      language === lang ? "text-primary bg-primary/10 font-bold" : "text-foreground"
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
            {theme === "light" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
          </button>

          {/* Hamburger Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-xl transition-all cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur-lg px-5 py-6 space-y-4 animate-in slide-in-from-top duration-200 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <nav className="flex flex-col gap-1 font-semibold text-sm">
            <Link
              href="/#samples-section"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Samples
            </Link>
            <Link
              href="/how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Pricing Plans
            </Link>
            <Link
              href="/packages"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              All Packages
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Blog & Guides
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Contact Support
            </Link>
          </nav>

          <hr className="border-border/40" />

          {/* Language Selector in Drawer */}
          <div className="space-y-2 px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Select Language</span>
            <div className="grid grid-cols-3 gap-2">
              {(["English", "Sinhala", "Tamil"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                    language === lang
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Mobile Auth Options */}
          {user ? (
            <div className="space-y-3 pt-1">
              <div className="text-xs font-semibold text-muted-foreground px-1 truncate">
                Signed in as: <span className="text-foreground font-bold">{user.email}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff7700] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 px-4 py-3 text-sm font-bold hover:bg-red-500/15 transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold text-foreground hover:bg-secondary transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#fe9a00] to-[#ff7700] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:opacity-95 transition-all"
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
