"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type UserSettings } from "@/lib/api";
import { DEFAULT_USER_SETTINGS } from "@/lib/defaults";
import type { Locale } from "@/i18n";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>({ ...DEFAULT_USER_SETTINGS });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (data: Partial<Omit<UserSettings, "id">>) => {
    try {
      const updated = await api.updateSettings(data);
      setSettings(updated);
      return updated;
    } catch {
      setSettings((prev) => ({ ...prev, ...data }));
      return { ...settings, ...data } as UserSettings;
    }
  }, [settings]);

  const locale: Locale = (settings.language as Locale) || "ru";

  return { settings, loading, updateSettings, locale };
}
