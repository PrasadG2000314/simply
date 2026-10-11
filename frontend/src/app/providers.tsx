"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Language = "English" | "Sinhala" | "Tamil";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function Providers({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("English");

  // Always enforce dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
