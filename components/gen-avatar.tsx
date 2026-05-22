"use client";

import React from "react";
import { Sparkles, Heart } from "lucide-react";

interface GenAvatarProps {
  seed?: number;
  ratio?: string;
  label?: { name: string; sub?: string };
  type?: 'human' | 'ai';
  style?: React.CSSProperties;
  className?: string;
}

export function GenAvatar({ 
  seed = 1, 
  ratio = '3/4', 
  label, 
  type = 'human', 
  style, 
  className = '' 
}: GenAvatarProps) {
  // Simple deterministic palette from seed
  const palettes = [
    ['oklch(0.78 0.18 25)', 'oklch(0.30 0.16 320)'],
    ['oklch(0.74 0.20 60)', 'oklch(0.25 0.18 280)'],
    ['oklch(0.72 0.18 350)', 'oklch(0.28 0.16 300)'],
    ['oklch(0.76 0.16 320)', 'oklch(0.22 0.14 260)'],
    ['oklch(0.70 0.20 0)', 'oklch(0.30 0.18 290)'],
    ['oklch(0.75 0.18 200)', 'oklch(0.25 0.16 305)'],
    ['oklch(0.78 0.16 100)', 'oklch(0.26 0.18 285)'],
    ['oklch(0.72 0.19 30)', 'oklch(0.28 0.14 270)'],
  ];
  
  const [ac, ad] = palettes[seed % palettes.length];
  const bx = 30 + ((seed * 13) % 40);
  const by = 22 + ((seed * 7) % 30);

  return (
    <div
      className={`avatar-gen noise ${className}`}
      style={{
        aspectRatio: ratio,
        // @ts-ignore
        '--ac': ac, '--ad': ad, '--bx': `${bx}%`, '--by': `${by}%`,
        ...style,
      }}
    >
      {/* faint silhouette suggestion */}
      <svg viewBox="0 0 100 130" preserveAspectRatio="xMidYMax meet" className="absolute bottom-0 left-0 right-0 w-full h-[85%] opacity-[0.18] mix-blend-soft-light">
        <defs>
          <radialGradient id={`g${seed}`} cx="50%" cy="20%" r="70%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </radialGradient>
        </defs>
        <ellipse cx="50" cy="30" rx="20" ry="24" fill={`url(#g${seed})`}/>
        <path d="M20 130 Q20 80 50 75 Q80 80 80 130 Z" fill={`url(#g${seed})`}/>
      </svg>
      
      {label && (
        <div className="absolute bottom-0 left-0 right-0 p-3.5 pb-3 z-10">
          <div className="serif text-white text-[22px] font-medium leading-[1.1]">
            {label.name}
          </div>
          {label.sub && (
            <div className="text-white/70 text-[11px] mt-1 italic">
              {label.sub}
            </div>
          )}
        </div>
      )}
      
      {type && (
        <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-full text-[10px] font-semibold backdrop-blur-md bg-opacity-75 text-white flex items-center gap-1"
          style={{ 
            backgroundColor: type === 'ai' ? 'oklch(0.55 0.18 300 / 0.75)' : 'oklch(0.65 0.20 0 / 0.75)' 
          }}
        >
          {type === 'ai' ? <Sparkles size={11}/> : <Heart size={11} fill="white" stroke="white"/>}
          {type === 'ai' ? 'IA' : 'Real'}
        </div>
      )}
    </div>
  );
}
