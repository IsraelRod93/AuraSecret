"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Check } from "lucide-react";
import { useTweaks, TweakValues } from "@/hooks/use-tweaks";

export function TweaksPanel() {
  const [tweaks, setTweak] = useTweaks();
  const [open, setOpen] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 16, y: 16 });
  const PAD = 16;

  const clampToViewport = useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth, h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y)),
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    clampToViewport();
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);

  const onDragStart = (e: React.MouseEvent) => {
    const sx = e.clientX, sy = e.clientY;
    const startRight = offsetRef.current.x;
    const startBottom = offsetRef.current.y;
    
    const move = (ev: MouseEvent) => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy),
      };
      clampToViewport();
    };
    
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  if (!open) return null;

  return (
    <div 
      ref={dragRef} 
      className="fixed z-[9999] width-[280px] max-h-[calc(100vh-32px)] flex flex-col bg-white/80 text-black backdrop-blur-xl border border-white/60 rounded-2xl shadow-2xl overflow-hidden font-sans text-[11.5px]"
      style={{ right: offsetRef.current.x, bottom: offsetRef.current.y, width: 280 }}
    >
      <div className="flex items-center justify-between p-2 pl-3.5 cursor-move select-none" onMouseDown={onDragStart}>
        <b className="text-[12px] font-semibold tracking-wide">Tweaks</b>
        <button 
          className="w-6 h-6 rounded-md hover:bg-black/5 flex items-center justify-center text-black/50 hover:text-black transition-colors"
          onClick={() => setOpen(false)}
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="p-3.5 pt-0 flex flex-col gap-2.5 overflow-y-auto min-h-0">
        <TweakSection label="Vista">
          <TweakRadio
            label="Rol"
            value={tweaks.role}
            onChange={v => setTweak('role', v)}
            options={[
              { value: 'cliente', label: 'Cliente' },
              { value: 'creadora', label: 'Creadora' },
            ]}
          />
        </TweakSection>

        <TweakSection label="Aspecto">
          <TweakColor
            label="Acento"
            value={tweaks.accent}
            onChange={v => setTweak('accent', v)}
            options={['#b489ff', '#ff89c5', '#5fc8d9', '#e4b855']}
          />
          <TweakRadio
            label="Fondo"
            value={tweaks.background}
            onChange={v => setTweak('background', v)}
            options={[
              { value: 'cosmic', label: 'Cósmico' },
              { value: 'flat',   label: 'Plano' },
            ]}
          />
          <TweakSlider
            label="Estrellas"
            value={tweaks.starDensity}
            onChange={v => setTweak('starDensity', v)}
            min={0} max={150} step={5}
          />
          <TweakSlider
            label="Tamaño de texto"
            value={tweaks.fontScale}
            onChange={v => setTweak('fontScale', v)}
            min={0.85} max={1.15} step={0.05}
          />
        </TweakSection>
      </div>
    </div>
  );
}

function TweakSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold text-black/45 tracking-widest uppercase mt-2.5 first:mt-0">{label}</div>
      {children}
    </div>
  );
}

function TweakSlider({ label, value, min, max, step, onChange }: any) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-black/70">
        <span className="font-medium">{label}</span>
        <span className="text-black/50 tabular-nums">{value}</span>
      </div>
      <input 
        type="range" 
        className="w-full h-1 bg-black/10 rounded-full appearance-none outline-none cursor-pointer"
        min={min} max={max} step={step} value={value} 
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TweakRadio({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-black/70">{label}</div>
      <div className="flex p-0.5 bg-black/5 rounded-lg">
        {options.map((o: any) => (
          <button
            key={o.value}
            className={`flex-1 py-1 px-1.5 rounded-md text-[11px] font-medium transition-all ${
              value === o.value ? 'bg-white shadow-sm text-black' : 'text-black/50 hover:text-black/70'
            }`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function TweakColor({ label, value, options, onChange }: any) {
  return (
    <div className="space-y-1">
      <div className="font-medium text-black/70">{label}</div>
      <div className="flex gap-1.5">
        {options.map((o: string) => (
          <button
            key={o}
            className={`relative w-full h-11 rounded-md shadow-sm border border-black/10 transition-transform hover:-translate-y-0.5 ${
              value === o ? 'ring-2 ring-black/80' : ''
            }`}
            style={{ backgroundColor: o }}
            onClick={() => onChange(o)}
          >
            {value === o && <Check size={12} className="absolute top-1 right-1 text-white drop-shadow-md" />}
          </button>
        ))}
      </div>
    </div>
  );
}
