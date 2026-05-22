"use client";

import React from "react";

export function OracleOrb({ size = 220 }: { size?: number }) {
  const orbSize = Math.round(size * 0.545);
  return (
    <div className="orb-wrap mx-auto" style={{ width: size, height: size }}>
      <div className="orb-ring" />
      <div className="orb-ring b" />
      <div className="orb" style={{ width: orbSize, height: orbSize }} />
      
      {/* Orbiting particles */}
      <div className="absolute inset-0 animate-[orbitA_14s_linear_infinite]">
        <div className="orb-particle" style={{ top: '50%', left: '94%', transform: 'translate(-50%,-50%)' }} />
      </div>
      <div className="absolute inset-0 animate-[orbitB_18s_linear_infinite_reverse]">
        <div className="orb-particle" style={{
          top: '12%', left: '20%', 
          background: 'oklch(0.8 0.2 300)',
          boxShadow: '0 0 10px oklch(0.8 0.2 300), 0 0 20px oklch(0.6 0.18 300 / 0.5)',
        }} />
      </div>

      <style jsx>{`
        @keyframes orbitA {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbitB {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
