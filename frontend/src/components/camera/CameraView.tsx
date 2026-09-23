"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ScanLine, AlertCircle, WifiOff, RotateCcw, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useApp } from "@/components/providers";
import { useSpeech } from "@/hooks/useSpeech";
import { api, type Detection } from "@/lib/api";

/** `object-fit: cover` — масштаб по большей стороне, обрезка по центру */
function mapBboxToScreen(
  bbox: [number, number, number, number],
  videoW: number,
  videoH: number,
  containerW: number,
  containerH: number,
) {
  const scale = Math.max(containerW / videoW, containerH / videoH);
  const offsetX = (containerW - videoW * scale) / 2;
  const offsetY = (containerH - videoH * scale) / 2;
  const [x1, y1, x2, y2] = bbox;
  return {
    left: x1 * videoW * scale + offsetX,
    top: y1 * videoH * scale + offsetY,
    width: (x2 - x1) * videoW * scale,
    height: (y2 - y1) * videoH * scale,
  };
}

export function CameraView() {
  const { dict, settings, locale } = useApp();
  const { speak } = useSpeech({
    lang: locale === "ru" ? "ru-RU" : "en-US",
    rate: settings.voice_speed,
    enabled: settings.voice_enabled,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const announcedRef = useRef<Set<string>>(new Set());
  const busyRef = useRef(false);

  const [isStreaming, setIsStreaming] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isHttpError, setIsHttpError] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [lastInferenceMs, setLastInferenceMs] = useState<number | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [layoutSize, setLayoutSize] = useState({ w: 0, h: 0 });
  const [videoMetaTick, setVideoMetaTick] = useState(0);
  const [saved, setSaved] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsHttpError(false);

    if (typeof window !== "undefined" && !navigator.mediaDevices?.getUserMedia) {
      const isHttp =
        window.location.protocol === "http:" && window.location.hostname !== "localhost";
      if (isHttp) {
        setIsHttpError(true);
        setCameraError(
          locale === "ru" ? "Камера требует HTTPS-соединение" : "Camera requires HTTPS connection",
        );
        return;
      }
      setCameraError(dict.camera.cameraError);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsStreaming(true);
    } catch {
      setCameraError(dict.camera.cameraError);
    }
  }, [dict, locale]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setLayoutSize({ w: Math.round(r.width), h: Math.round(r.height) });
    });
    ro.observe(el);
    const r0 = el.getBoundingClientRect();
    setLayoutSize({ w: Math.round(r0.width), h: Math.round(r0.height) });
    return () => ro.disconnect();
  }, []);

  // Real-time detection loop
  useEffect(() => {
    if (!isStreaming) return;
    let active = true;
    announcedRef.current.clear();

    const loop = async () => {
      while (active) {
        if (busyRef.current) {
          await new Promise((r) => setTimeout(r, 50));
          continue;
        }

        const video = videoRef.current;
        const canvas = captureCanvasRef.current;
        if (!video || !canvas || video.videoWidth === 0) {
          await new Promise((r) => setTimeout(r, 200));
          continue;
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const maxDim = 640;
        const s = Math.min(maxDim / vw, maxDim / vh, 1);
        canvas.width = Math.round(vw * s);
        canvas.height = Math.round(vh * s);

        const ctx = canvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.7),
        );

        if (!blob || !active) break;

        busyRef.current = true;
        setDetecting(true);

        try {
          const result = await api.detect(blob);
          if (!active) break;
          setDetectError(null);
          setDetections(result.detections);
          setLastInferenceMs(typeof result.inference_ms === "number" ? result.inference_ms : null);

          for (const det of result.detections) {
            const mode = settings.voice_mode === "department" ? "department" : "product";
            const announceKey =
              mode === "department" ? `dept:${det.category}` : `prod:${det.product}`;

            if (!announcedRef.current.has(announceKey)) {
              announcedRef.current.add(announceKey);
              const text =
                mode === "department"
                  ? locale === "ru"
                    ? det.category_ru
                    : det.category
                  : locale === "ru"
                    ? det.product_ru
                    : det.product;
              speak(text);
              setTimeout(() => announcedRef.current.delete(announceKey), 8000);
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          if (active) {
            setDetectError(msg);
            setDetections([]);
          }
        } finally {
          busyRef.current = false;
          setDetecting(false);
        }

        await new Promise((r) => setTimeout(r, 150));
      }
    };

    loop();
    return () => {
      active = false;
    };
  }, [isStreaming, locale, speak, settings.voice_mode]);

  const handleSave = useCallback(async () => {
    if (detections.length === 0) return;

    // Deduplicate by product name, keep highest confidence
    const byProduct = new Map<string, (typeof detections)[number]>();
    for (const det of detections) {
      const prev = byProduct.get(det.product);
      if (!prev || det.confidence > prev.confidence) {
        byProduct.set(det.product, det);
      }
    }

    const items = [...byProduct.values()].map((det) => ({
      category: det.category,
      category_ru: det.category_ru,
      product_detail: locale === "ru" ? det.product_ru : det.product,
      confidence: det.confidence,
    }));

    try {
      await api.saveHistory(items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      /* ignore */
    }
  }, [detections, locale]);

  const containerW = layoutSize.w;
  const containerH = layoutSize.h;
  const videoW = videoRef.current?.videoWidth ?? 1;
  const videoH = videoRef.current?.videoHeight ?? 1;
  void videoMetaTick;

  if (cameraError) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: 32,
          textAlign: "center",
        }}
        className="bg-background"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "oklch(0.63 0.24 29 / 12%)",
          }}
        >
          {isHttpError ? (
            <WifiOff style={{ width: 36, height: 36, color: "oklch(0.63 0.24 29)" }} />
          ) : (
            <AlertCircle style={{ width: 36, height: 36, color: "oklch(0.63 0.24 29)" }} />
          )}
        </motion.div>
        <motion.div
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.25 }}
        >
          <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{cameraError}</p>
          <p style={{ fontSize: 14, maxWidth: 300, color: "oklch(0.5 0 0)" }}>
            {isHttpError
              ? locale === "ru"
                ? "Откройте через HTTPS или localhost"
                : "Open via HTTPS or localhost"
              : dict.camera.cameraPermission}
          </p>
        </motion.div>
        {!isHttpError && (
          <motion.button
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.25 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setCameraError(null);
              startCamera();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 48,
              padding: "0 28px",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              background: "oklch(0.65 0.24 264)",
              color: "white",
              border: "none",
            }}
          >
            <RotateCcw style={{ width: 16, height: 16 }} /> {dict.camera.retry}
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, background: "#000" }}>
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
        playsInline
        muted
        autoPlay
        onLoadedMetadata={() => setVideoMetaTick((t) => t + 1)}
      />
      <canvas ref={captureCanvasRef} style={{ display: "none" }} />

      {/* Logo badge + status */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          pointerEvents: "none",
          padding: "max(env(safe-area-inset-top, 12px), 12px) 14px 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          className="glass glass-shine"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 12,
            padding: "6px 12px",
            pointerEvents: "auto",
          }}
        >
          <ScanLine style={{ width: 15, height: 15, color: "oklch(0.65 0.24 264)" }} strokeWidth={2.4} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "white", letterSpacing: "-0.01em" }}>
            ShopSee
          </span>
        </div>

        {/* Статус детекции: не мигаем «0ms» — показываем последний удачный latency */}
        <div
          className="glass"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            borderRadius: 10,
            padding: "4px 10px",
            pointerEvents: "auto",
            maxWidth: "48%",
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: detectError ? "#f87171" : detecting ? "#4ade80" : "rgba(255,255,255,0.35)",
              boxShadow: detecting ? "0 0 6px #4ade80" : "none",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
            title={detectError ?? undefined}
          >
            {detectError
              ? locale === "ru"
                ? "Нет связи с сервером"
                : "Server unreachable"
              : lastInferenceMs != null
                ? `${detecting ? "… " : ""}${lastInferenceMs} ms`
                : detecting
                  ? "…"
                  : "—"}
          </span>
        </div>
      </div>

      {/* Bounding boxes */}
      {containerW > 0 &&
        detections.map((det, i) => {
          const box = mapBboxToScreen(det.bbox, videoW, videoH, containerW, containerH);
          return (
            <div
              key={`${det.product}-${i}`}
              style={{
                position: "absolute",
                left: box.left,
                top: box.top,
                width: box.width,
                height: box.height,
                border: `2px solid ${det.color}`,
                borderRadius: 10,
                zIndex: 15,
                transition: "all 0.15s ease-out",
                boxShadow: `0 0 12px ${det.color}44, inset 0 0 12px ${det.color}11`,
                pointerEvents: "none",
              }}
            >
              {/* Label */}
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: 0,
                  marginBottom: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  whiteSpace: "nowrap",
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: det.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                  {locale === "ru" ? det.product_ru : det.product}
                </span>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                  {det.confidence}%
                </span>
              </div>
            </div>
          );
        })}

      {/* Bottom status bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 80,
          zIndex: 20,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: "0 16px",
          pointerEvents: "none",
        }}
      >
        {detections.length === 0 && isStreaming && (
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "rgba(255,255,255,0.55)",
              textShadow: "0 1px 6px rgba(0,0,0,0.6)",
              textAlign: "center",
            }}
          >
            {locale === "ru" ? "Наведите камеру на продукт" : "Point camera at a product"}
          </p>
        )}

        {detections.length > 0 && (
          <div
            className="glass glass-shine"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              borderRadius: 16,
              padding: "8px 14px",
              pointerEvents: "auto",
              maxWidth: 360,
              width: "100%",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "white" }}>
                {detections.map((d) => (locale === "ru" ? d.product_ru : d.product)).join(", ")}
              </p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
                {detections
                  .map((d) => (locale === "ru" ? d.category_ru : d.category))
                  .filter((v, i, a) => a.indexOf(v) === i)
                  .join(" · ")}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                height: 32,
                padding: "0 12px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                background: saved ? "#4ade80" : "oklch(0.65 0.24 264)",
                color: saved ? "#000" : "white",
                border: "none",
                transition: "background 0.2s, color 0.2s",
                flexShrink: 0,
              }}
            >
              <Save style={{ width: 13, height: 13 }} />
              {saved
                ? locale === "ru"
                  ? "Готово"
                  : "Saved"
                : locale === "ru"
                  ? "Сохранить"
                  : "Save"}
            </motion.button>
          </div>
        )}
      </div>

      {/* Scan indicator */}
      <AnimatePresence>
        {!isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.15)",
                borderTopColor: "oklch(0.65 0.24 264)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
