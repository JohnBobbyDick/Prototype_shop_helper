"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { useSettings } from "@/hooks/useSettings";
import { getDictionary, type Locale } from "@/i18n";
import type { UserSettings } from "@/lib/api";

interface AppContextType {
  settings: UserSettings;
  locale: Locale;
  dict: ReturnType<typeof getDictionary>;
  updateSettings: (data: Partial<Omit<UserSettings, "id">>) => Promise<UserSettings>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be inside AppProvider");
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { settings, loading, updateSettings, locale } = useSettings();
  const dict = getDictionary(locale);

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.fontsize = settings.font_size;
  }, [settings.font_size]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("high-contrast", settings.high_contrast);
  }, [settings.high_contrast]);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AppContext.Provider value={{ settings, locale, dict, updateSettings, loading }}>
        {children}
      </AppContext.Provider>
    </ThemeProvider>
  );
}
