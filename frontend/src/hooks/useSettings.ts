"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type UserSettings } from "@/lib/api";
import type { Locale } from "@/i18n";

const DEFAULT_SETTINGS: UserSettings = {
  id: 0,
  language: "ru",
  voice_enabled: true,
  voice_speed: 1.0,
  high_contrast: true,
  font_size: "large",
};

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
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
