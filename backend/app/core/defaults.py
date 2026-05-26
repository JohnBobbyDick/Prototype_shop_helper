"""
Default accessibility settings for every fresh install.
Keep in sync with frontend/src/lib/defaults.ts
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class UserSettingsDefaults:
    language: str = "ru"
    voice_enabled: bool = True
    voice_speed: float = 1.0
    high_contrast: bool = True
    font_size: str = "large"


DEFAULT_USER_SETTINGS = UserSettingsDefaults()


def default_settings_kwargs() -> dict:
    d = DEFAULT_USER_SETTINGS
    return {
        "language": d.language,
        "voice_enabled": d.voice_enabled,
        "voice_speed": d.voice_speed,
        "high_contrast": d.high_contrast,
        "font_size": d.font_size,
    }
