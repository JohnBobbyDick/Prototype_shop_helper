"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScanLine, Clock, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/components/providers";

const NAV_ITEMS = [
  { href: "/history", icon: Clock, labelKey: "nav.history" },
  { href: "/", icon: ScanLine, labelKey: "nav.camera", isCenter: true },
  { href: "/settings", icon: SlidersHorizontal, labelKey: "nav.settings" },
] as const;

function getLabel(dict: Record<string, unknown>, key: string): string {
  const parts = key.split(".");
  let obj: unknown = dict;
  for (const p of parts) {
    if (obj && typeof obj === "object" && p in obj) {
      obj = (obj as Record<string, unknown>)[p];
    } else return key;
  }
  return typeof obj === "string" ? obj : key;
}

export function BottomNav() {
  const pathname = usePathname();
  const { dict } = useApp();

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="navigation"
      aria-label="Main"
    >
      <div
        className="glass-strong glass-shine"
        style={{
          margin: "0 12px 8px",
          borderRadius: 22,
          padding: "4px 6px",
          maxWidth: 400,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around" }}>
          {NAV_ITEMS.map((item) => {
            const { href, icon: Icon, labelKey } = item;
            const isCenter = "isCenter" in item && item.isCenter;
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                style={{
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: isCenter ? 60 : 52,
                  minHeight: 44,
                  padding: "4px 14px",
                  borderRadius: 16,
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "color 0.2s ease-out",
                  color: active
                    ? "oklch(0.65 0.24 264)"
                    : "oklch(0.45 0 0)",
                }}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 16,
                      background: "oklch(0.65 0.24 264 / 10%)",
                    }}
                  />
                )}
                <Icon
                  style={{
                    position: "relative",
                    zIndex: 1,
                    width: isCenter ? 24 : 20,
                    height: isCenter ? 24 : 20,
                  }}
                  strokeWidth={active ? 2.2 : 1.6}
                />
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    fontSize: 10,
                    fontWeight: active ? 600 : 500,
                    marginTop: 1,
                    letterSpacing: "0.01em",
                  }}
                >
                  {getLabel(dict, labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
