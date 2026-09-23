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
      .then((s) =>
        setSettings({
          ...DEFAULT_USER_SETTINGS,
          ...s,
          voice_mode: s.voice_mode === "department" ? "department" : "product",
        }),
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateSettings = useCallback(async (data: Partial<Omit<UserSettings, "id">>) => {
    try {
      const updated = await api.updateSettings(data);
      const next: UserSettings = {
        ...DEFAULT_USER_SETTINGS,
        ...updated,
        voice_mode: updated.voice_mode === "department" ? "department" : "product",
      };
      setSettings(next);
      return next;
    } catch {
      let next!: UserSettings;
      setSettings((prev) => {
        next = { ...prev, ...data } as UserSettings;
        return next;
      });
      return next;
    }
  }, []);

  const locale: Locale = (settings.language as Locale) || "ru";

  return { settings, loading, updateSettings, locale };
}
