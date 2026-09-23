"use client";

import { Globe, Volume2, Type, Contrast, Check } from "lucide-react";
import { motion } from "motion/react";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useApp } from "@/components/providers";

function Section({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.25 }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 8,
          paddingLeft: 4,
        }}
      >
        <Icon style={{ width: 13, height: 13, color: "oklch(0.45 0 0)" }} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "oklch(0.45 0 0)",
          }}
        >
          {title}
        </span>
      </div>
      <div
        className="glass glass-shine"
        style={{ borderRadius: 18, overflow: "hidden" }}
      >
        {children}
      </div>
    </motion.div>
  );
}

function Row({
  children,
  border = true,
}: {
  children: React.ReactNode;
  border?: boolean;
}) {
  return (
    <div
      style={{
        padding: "12px 16px",
        minHeight: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: border ? "1px solid rgba(255,255,255,0.04)" : "none",
      }}
    >
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { dict, settings, updateSettings, locale } = useApp();

  const textScale =
    settings.font_size === "xlarge" ? 1.45 : settings.font_size === "large" ? 1.2 : 1;
  const s = (base: number) => Math.round(base * textScale);

  return (
    <div
      className="bg-background"
      style={{
        position: "absolute",
        inset: 0,
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        paddingTop: "max(env(safe-area-inset-top, 12px), 12px)",
      }}
    >
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 20px" }}>
        <motion.h1
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: s(26),
            fontWeight: 800,
            letterSpacing: "-0.02em",
            paddingTop: 8,
            paddingBottom: 14,
          }}
        >
          {dict.settings.title}
        </motion.h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 120 }}>
          {/* Language */}
          <Section icon={Globe} title={dict.settings.language} delay={0.03}>
            <Row border={false}>
              <div style={{ display: "flex", gap: 6, width: "100%" }}>
                {[
                  { code: "ru", label: "Русский" },
                  { code: "en", label: "English" },
                ].map(({ code, label }) => {
                  const active = locale === code;
                  return (
                    <motion.button
                      key={code}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateSettings({ language: code })}
                      style={{
                        flex: 1,
                        height: 44,
                        borderRadius: 12,
                        fontSize: s(14),
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        border: "none",
                        transition: "all 0.2s ease-out",
                        background: active ? "oklch(0.65 0.24 264)" : "rgba(255,255,255,0.05)",
                        color: active ? "white" : "oklch(0.7 0 0)",
                      }}
                    >
                      {active && <Check style={{ width: 14, height: 14 }} />}
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </Row>
          </Section>

          {/* Voice */}
          <Section icon={Volume2} title={dict.settings.accessibility} delay={0.06}>
            <Row>
              <span style={{ fontSize: s(15), fontWeight: 600 }}>{dict.settings.voice}</span>
              <Switch
                checked={settings.voice_enabled}
                onCheckedChange={(v) => updateSettings({ voice_enabled: v })}
              />
            </Row>
            <Row>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <span style={{ fontSize: s(15), fontWeight: 600 }}>{dict.settings.voiceMode}</span>
                <div style={{ display: "flex", gap: 6, width: "100%" }}>
                  {(
                    [
                      { mode: "product" as const, label: dict.settings.voiceModeProduct },
                      { mode: "department" as const, label: dict.settings.voiceModeDepartment },
                    ] as const
                  ).map(({ mode, label }) => {
                    const active = settings.voice_mode === mode;
                    return (
                      <motion.button
                        key={mode}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => updateSettings({ voice_mode: mode })}
                        disabled={!settings.voice_enabled}
                        style={{
                          flex: 1,
                          height: 42,
                          borderRadius: 11,
                          fontSize: s(13),
                          fontWeight: active ? 700 : 500,
                          cursor: settings.voice_enabled ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                          border: "none",
                          transition: "all 0.2s ease-out",
                          opacity: settings.voice_enabled ? 1 : 0.45,
                          background: active ? "oklch(0.65 0.24 264)" : "rgba(255,255,255,0.05)",
                          color: active ? "white" : "oklch(0.7 0 0)",
                        }}
                      >
                        {active && <Check style={{ width: 13, height: 13, flexShrink: 0 }} />}
                        {label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </Row>
            <Row border={false}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ fontSize: s(15), fontWeight: 600 }}>
                    {dict.settings.voiceSpeed}
                  </span>
                  <span
                    style={{
                      fontSize: s(13),
                      fontWeight: 700,
                      color: "oklch(0.65 0.24 264)",
                    }}
                  >
                    {settings.voice_speed.toFixed(1)}x
                  </span>
                </div>
                <Slider
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={[settings.voice_speed]}
                  onValueChange={(val) =>
                    updateSettings({ voice_speed: Array.isArray(val) ? val[0] : val })
                  }
                  disabled={!settings.voice_enabled}
                />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    color: "oklch(0.4 0 0)",
                  }}
                >
                  <span>{dict.settings.voiceSpeedSlow}</span>
                  <span>{dict.settings.voiceSpeedFast}</span>
                </div>
              </div>
            </Row>
          </Section>

          {/* Appearance */}
          <Section icon={Type} title={dict.settings.appearance} delay={0.09}>
            <Row>
              <span style={{ fontSize: s(15), fontWeight: 600 }}>{dict.settings.fontSize}</span>
            </Row>
            <Row>
              <div style={{ display: "flex", gap: 6, width: "100%" }}>
                {(["normal", "large", "xlarge"] as const).map((size) => {
                  const active = settings.font_size === size;
                  const labelKey = `fontSize${size.charAt(0).toUpperCase() + size.slice(1)}` as
                    | "fontSizeNormal"
                    | "fontSizeLarge"
                    | "fontSizeXlarge";
                  const previewSize = size === "xlarge" ? 15 : size === "large" ? 13 : 12;
                  return (
                    <motion.button
                      key={size}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => updateSettings({ font_size: size })}
                      style={{
                        flex: 1,
                        height: 42,
                        borderRadius: 11,
                        fontSize: previewSize,
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        border: "none",
                        transition: "all 0.2s ease-out",
                        background: active ? "oklch(0.65 0.24 264)" : "rgba(255,255,255,0.05)",
                        color: active ? "white" : "oklch(0.7 0 0)",
                      }}
                    >
                      {active && <Check style={{ width: 13, height: 13, flexShrink: 0 }} />}
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dict.settings[labelKey]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </Row>
            <Row border={false}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Contrast style={{ width: 15, height: 15, color: "oklch(0.45 0 0)" }} />
                <span style={{ fontSize: s(15), fontWeight: 600 }}>
                  {dict.settings.highContrast}
                </span>
              </div>
              <Switch
                checked={settings.high_contrast}
                onCheckedChange={(v) => updateSettings({ high_contrast: v })}
              />
            </Row>
          </Section>
        </div>
      </div>
    </div>
  );
}
