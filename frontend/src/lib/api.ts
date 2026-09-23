const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function getApiBase(): string {
  if (API_BASE) return API_BASE;
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000";
    }
    return `${protocol}//${hostname}:8000`;
  }
  return "http://127.0.0.1:8000";
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBase()}${path}`, {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface AnalyzeResult {
  category: string;
  category_ru: string;
  product_detail: string | null;
  confidence: number;
}

export interface ScanHistoryItem {
  id: number;
  category: string;
  category_ru: string;
  product_detail: string | null;
  confidence: number;
  created_at: string;
}

export type VoiceMode = "product" | "department";

export interface UserSettings {
  id: number;
  language: string;
  voice_enabled: boolean;
  voice_speed: number;
  voice_mode: VoiceMode;
  high_contrast: boolean;
  font_size: string;
}

export interface HistoryCreateItem {
  category: string;
  category_ru: string;
  product_detail: string | null;
  confidence: number;
}

export interface Detection {
  bbox: [number, number, number, number];
  confidence: number;
  product: string;
  product_ru: string;
  category: string;
  category_ru: string;
  color: string;
}

export interface DetectResult {
  detections: Detection[];
  inference_ms: number;
}

export const api = {
  async detect(imageBlob: Blob): Promise<DetectResult> {
    const formData = new FormData();
    formData.append("file", imageBlob, "frame.jpg");
    return request<DetectResult>("/api/detect", {
      method: "POST",
      body: formData,
    });
  },

  async analyze(imageBlob: Blob): Promise<AnalyzeResult> {
    const formData = new FormData();
    formData.append("file", imageBlob, "capture.jpg");
    return request<AnalyzeResult>("/api/analyze", {
      method: "POST",
      body: formData,
    });
  },

  async saveHistory(items: HistoryCreateItem[]): Promise<ScanHistoryItem[]> {
    return request<ScanHistoryItem[]>("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(items),
    });
  },

  async getHistory(limit = 50): Promise<ScanHistoryItem[]> {
    return request<ScanHistoryItem[]>(`/api/history?limit=${limit}`);
  },

  async clearHistory(): Promise<void> {
    await request("/api/history", { method: "DELETE" });
  },

  async getSettings(): Promise<UserSettings> {
    return request<UserSettings>("/api/settings");
  },

  async updateSettings(data: Partial<Omit<UserSettings, "id">>): Promise<UserSettings> {
    return request<UserSettings>("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },
};
