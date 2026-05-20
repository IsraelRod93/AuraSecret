import { motion } from "framer-motion";

export function CelestialBackground() {
  return (
    <div className="fixed inset-0 z-0 bg-cosmic-gradient overflow-hidden">
      {/* Stars/Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          initial={{ 
            top: Math.random() * 100 + "%", 
            left: Math.random() * 100 + "%",
            opacity: Math.random() 
          }}
          animate={{ opacity: [0.2, 1, 0.2] }}
          transition={{ duration: 2 + Math.random() * 3, repeat: Infinity }}
        />
      ))}
    </div>
  );
}
