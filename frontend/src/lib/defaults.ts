/**
 * Default accessibility settings — must match backend/app/core/defaults.py
 */
export const DEFAULT_USER_SETTINGS = {
  id: 0,
  language: "ru",
  voice_enabled: true,
  voice_speed: 1.0,
  voice_mode: "product" as "product" | "department",
  high_contrast: true,
  font_size: "large",
} as const;
