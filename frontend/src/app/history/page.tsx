"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, Clock, PackageOpen, AlertCircle, RefreshCw } from "lucide-react";
import { useApp } from "@/components/providers";
import { api, type ScanHistoryItem } from "@/lib/api";
import { CategoryIcon } from "@/lib/categories";

export default function HistoryPage() {
  const { dict, locale, settings } = useApp();
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const localeRef = useRef(locale);
  localeRef.current = locale;

  const scale = settings.font_size === "xlarge" ? 1.45 : settings.font_size === "large" ? 1.2 : 1;
  const s = (base: number) => Math.round(base * scale);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHistory();
      setItems(Array.isArray(data) ? data : []);
    } catch {
      setError(
        localeRef.current === "ru"
          ? "Не удалось загрузить историю. Проверьте, что бэкенд запущен."
          : "Could not load history. Make sure the backend is running.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const handleClear = useCallback(async () => {
    if (!confirm(dict.history.clearConfirm)) return;
    try {
      await api.clearHistory();
      setItems([]);
    } catch {
      /* ignore */
    }
  }, [dict.history.clearConfirm]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(locale === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
        <div
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
            <button
              type="button"
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
            </button>
          )}
        </div>

        <div style={{ paddingBottom: 120 }}>
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
              <div
                className="history-spinner"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "2.5px solid rgba(255,255,255,0.06)",
                  borderTopColor: "oklch(0.65 0.24 264)",
                }}
              />
              <style>{`
                @keyframes history-spin { to { transform: rotate(360deg); } }
                .history-spinner { animation: history-spin 1s linear infinite; }
              `}</style>
            </div>
          ) : error ? (
            <div
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
                  background: "oklch(0.63 0.24 29 / 12%)",
                }}
              >
                <AlertCircle
                  style={{ width: 32, height: 32, color: "oklch(0.63 0.24 29)" }}
                  strokeWidth={1.4}
                />
              </div>
              <p style={{ fontSize: s(14), fontWeight: 600, color: "oklch(0.55 0 0)", maxWidth: 280 }}>
                {error}
              </p>
              <button
                type="button"
                onClick={loadHistory}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  height: 40,
                  padding: "0 16px",
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "oklch(0.65 0.24 264)",
                  color: "white",
                  border: "none",
                }}
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
                {locale === "ru" ? "Повторить" : "Retry"}
              </button>
            </div>
          ) : items.length === 0 ? (
            <div
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
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {items.map((item) => (
                <div
                  key={item.id}
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
                      {settings.voice_mode === "department"
                        ? locale === "ru"
                          ? item.category_ru
                          : item.category
                        : item.product_detail ||
                          (locale === "ru" ? item.category_ru : item.category)}
                    </p>
                    {settings.voice_mode === "department"
                      ? item.product_detail && (
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
                        )
                      : item.product_detail && (
                          <p
                            style={{
                              fontSize: s(13),
                              color: "oklch(0.5 0 0)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {locale === "ru" ? item.category_ru : item.category}
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
