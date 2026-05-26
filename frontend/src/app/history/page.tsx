"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Clock, PackageOpen } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/components/providers";
import { api, type ScanHistoryItem } from "@/lib/api";
import { CategoryIcon } from "@/lib/categories";

export default function HistoryPage() {
  const { dict, locale, settings } = useApp();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const scale = settings.font_size === "xlarge" ? 1.45 : settings.font_size === "large" ? 1.2 : 1;
  const s = (base: number) => Math.round(base * scale);

  const loadHistory = useCallback(async () => {
    try {
      setItems(await api.getHistory());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleClear = useCallback(async () => {
    if (!confirm(dict.history.clearConfirm)) return;
    try {
      await api.clearHistory();
      setItems([]);
    } catch {
      /* ignore */
    }
  }, [dict]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

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
        {/* Header */}
        <motion.div
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 8,
            paddingBottom: 14,
          }}
        >
          <h1 style={{ fontSize: s(26), fontWeight: 800, letterSpacing: "-0.02em" }}>
            {dict.history.title}
          </h1>
          {items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleClear}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 32,
                padding: "0 10px",
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: "oklch(0.63 0.24 29 / 12%)",
                color: "oklch(0.63 0.24 29)",
                border: "none",
              }}
            >
              <Trash2 style={{ width: 13, height: 13 }} /> {dict.history.clear}
            </motion.button>
          )}
        </motion.div>

        {/* Content */}
        <div style={{ paddingBottom: 120 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.06)",
                  borderTopColor: "oklch(0.65 0.24 264)",
                }}
              />
            </div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                paddingTop: 80,
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                <PackageOpen
                  style={{ width: 32, height: 32, color: "oklch(0.35 0 0)" }}
                  strokeWidth={1.4}
                />
              </div>
              <div>
                <p style={{ fontSize: s(16), fontWeight: 700, color: "oklch(0.5 0 0)" }}>
                  {dict.history.empty}
                </p>
                <p style={{ fontSize: s(13), marginTop: 4, color: "oklch(0.35 0 0)" }}>
                  {dict.history.emptyDesc}
                </p>
              </div>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <AnimatePresence>
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ x: -12, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 12, opacity: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.25 }}
                    className="glass glass-shine"
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <CategoryIcon category={item.category} size={18} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: s(15),
                          fontWeight: 700,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {locale === "ru" ? item.category_ru : item.category}
                      </p>
                      {item.product_detail && (
                        <p
                          style={{
                            fontSize: s(13),
                            color: "oklch(0.5 0 0)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.product_detail}
                        </p>
                      )}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginTop: 3,
                          fontSize: 11,
                          color: "oklch(0.4 0 0)",
                        }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <Clock style={{ width: 10, height: 10 }} /> {formatTime(item.created_at)}
                        </span>
                        <span style={{ fontWeight: 700, color: "oklch(0.65 0.24 264)" }}>
                          {Math.round(item.confidence)}%
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
