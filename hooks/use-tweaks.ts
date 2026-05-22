"use client";

import { useState, useCallback, useEffect } from "react";

export interface TweakValues {
  role: "cliente" | "creadora";
  accent: string;
  starDensity: number;
  fontScale: number;
  background: "cosmic" | "flat";
}

export const TWEAK_DEFAULTS: TweakValues = {
  role: "cliente",
  accent: "#b489ff",
  starDensity: 60,
  fontScale: 1,
  background: "cosmic",
};

export function useTweaks(defaults: TweakValues = TWEAK_DEFAULTS) {
  const [values, setValues] = useState<TweakValues>(defaults);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("aura-tweaks");
    if (saved) {
      try {
        setValues((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to parse tweaks", e);
      }
    }
  }, []);

  const setTweak = useCallback((keyOrEdits: keyof TweakValues | Partial<TweakValues>, val?: any) => {
    setValues((prev) => {
      const edits = typeof keyOrEdits === "object" ? keyOrEdits : { [keyOrEdits]: val };
      const next = { ...prev, ...edits };
      localStorage.setItem("aura-tweaks", JSON.stringify(next));
      return next;
    });
  }, []);

  return [values, setTweak] as const;
}
