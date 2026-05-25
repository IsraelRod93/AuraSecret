"use client";

import { useEffect, useRef, useState } from "react";

interface WatermarkedImageProps {
  src: string;
  watermarkText: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function WatermarkedImage({ src, watermarkText, className, alt, style }: WatermarkedImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [corsError, setCorsError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(14, Math.min(img.naturalWidth * 0.045, 26));
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 4;

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 5);

      const stepX = fontSize * 8;
      const stepY = fontSize * 4;
      const cols = Math.ceil(canvas.width / stepX) + 3;
      const rows = Math.ceil(canvas.height / stepY) + 3;

      for (let row = -rows; row <= rows; row++) {
        for (let col = -cols; col <= cols; col++) {
          ctx.fillStyle = "rgba(255,255,255,0.28)";
          ctx.fillText(watermarkText, col * stepX, row * stepY);
        }
      }

      ctx.restore();
    };

    img.onerror = () => setCorsError(true);
    img.src = src;
  }, [src, watermarkText]);

  if (corsError) {
    // CSS fallback: watermark as overlay if canvas CORS fails
    return (
      <div className="relative w-full h-full" style={style}>
        <img src={src} alt={alt} className={className} />
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          style={{ userSelect: "none" }}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              className="absolute text-white font-bold opacity-25 whitespace-nowrap"
              style={{
                fontSize: 14,
                top: `${(i % 4) * 28 + 5}%`,
                left: `${Math.floor(i / 4) * 38 - 10}%`,
                transform: "rotate(-25deg)",
                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              {watermarkText}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return <canvas ref={canvasRef} className={className} style={style} aria-label={alt} />;
}
