"use client";

import { motion } from "framer-motion";

export function OracleOrb() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.2 300 / 0.1) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute w-48 h-48 rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.7 0.18 300 / 0.15) 0%, transparent 70%)",
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />

      {/* Main orb */}
      <motion.div
        className="relative w-32 h-32 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, 
              oklch(0.85 0.15 300 / 0.8) 0%, 
              oklch(0.6 0.2 300 / 0.6) 30%,
              oklch(0.4 0.18 290 / 0.4) 60%,
              oklch(0.2 0.1 280 / 0.2) 100%
            )
          `,
          boxShadow: `
            0 0 60px oklch(0.7 0.2 300 / 0.5),
            0 0 100px oklch(0.6 0.18 300 / 0.3),
            inset 0 0 40px oklch(0.9 0.1 300 / 0.4),
            inset -10px -10px 40px oklch(0.3 0.15 280 / 0.5)
          `,
        }}
        animate={{
          scale: [1, 1.02, 1],
          boxShadow: [
            `0 0 60px oklch(0.7 0.2 300 / 0.5), 0 0 100px oklch(0.6 0.18 300 / 0.3), inset 0 0 40px oklch(0.9 0.1 300 / 0.4), inset -10px -10px 40px oklch(0.3 0.15 280 / 0.5)`,
            `0 0 80px oklch(0.75 0.22 300 / 0.6), 0 0 120px oklch(0.65 0.2 300 / 0.4), inset 0 0 50px oklch(0.95 0.12 300 / 0.5), inset -10px -10px 50px oklch(0.35 0.17 280 / 0.6)`,
            `0 0 60px oklch(0.7 0.2 300 / 0.5), 0 0 100px oklch(0.6 0.18 300 / 0.3), inset 0 0 40px oklch(0.9 0.1 300 / 0.4), inset -10px -10px 40px oklch(0.3 0.15 280 / 0.5)`,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner light reflection */}
        <div
          className="absolute top-4 left-4 w-8 h-8 rounded-full opacity-60"
          style={{
            background: "radial-gradient(circle, oklch(0.95 0.05 300) 0%, transparent 70%)",
          }}
        />

        {/* Mystical inner pattern */}
        <motion.div
          className="absolute inset-4 rounded-full opacity-30"
          style={{
            background: `
              conic-gradient(from 0deg at 50% 50%, 
                transparent 0deg, 
                oklch(0.8 0.2 300 / 0.5) 60deg, 
                transparent 120deg,
                oklch(0.75 0.15 70 / 0.3) 180deg,
                transparent 240deg,
                oklch(0.7 0.18 300 / 0.4) 300deg,
                transparent 360deg
              )
            `,
          }}
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </motion.div>

      {/* Orbiting particles */}
      <motion.div
        className="absolute w-2 h-2 rounded-full"
        style={{
          background: "oklch(0.75 0.15 70)",
          boxShadow: "0 0 10px oklch(0.75 0.15 70)",
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="absolute w-2 h-2 rounded-full"
          style={{
            transform: "translateX(80px)",
            background: "oklch(0.75 0.15 70)",
            boxShadow: "0 0 10px oklch(0.75 0.15 70)",
          }}
        />
      </motion.div>

      <motion.div
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          background: "oklch(0.8 0.2 300)",
          boxShadow: "0 0 8px oklch(0.8 0.2 300)",
        }}
        animate={{
          rotate: [360, 0],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        <div
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            transform: "translateX(100px)",
            background: "oklch(0.8 0.2 300)",
            boxShadow: "0 0 8px oklch(0.8 0.2 300)",
          }}
        />
      </motion.div>
    </div>
  );
}
