"use client";

import { useMemo } from "react";
import { useTweaks } from "@/hooks/use-tweaks";

export function CelestialBackground() {
  const [tweaks] = useTweaks();
  const density = tweaks.starDensity;

  const stars = useMemo(() =>
    Array.from({ length: density }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 1.8 + 0.6,
      delay: Math.random() * 4,
      dur: Math.random() * 2 + 2.5,
    })), [density]);

  if (tweaks.background === 'flat') {
    return <div className="fixed inset-0 bg-background pointer-events-none" />;
  }

  return (
    <div className="cosmic-bg fixed inset-0 pointer-events-none">
      <div className="nebula a" />
      <div className="nebula b" />
      {stars.map(s => (
        <div key={s.id} className="star" style={{
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size,
          // @ts-ignore
          '--delay': `${s.delay}s`,
          '--dur': `${s.dur}s`,
        }} />
      ))}
    </div>
  );
}
