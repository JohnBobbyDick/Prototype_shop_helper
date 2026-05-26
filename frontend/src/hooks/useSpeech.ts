"use client";

import { useCallback, useRef } from "react";

interface UseSpeechOptions {
  lang?: string;
  rate?: number;
  enabled?: boolean;
}

export function useSpeech({ lang = "ru-RU", rate = 1.0, enabled = true }: UseSpeechOptions = {}) {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find((v) => v.lang.startsWith(lang.split("-")[0]));
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [lang, rate, enabled],
  );

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
}
