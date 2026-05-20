import { motion } from "framer-motion";

export function OracleOrb() {
  return (
    <motion.div
      className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary via-cosmic to-background border border-primary/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(179,136,255,0.3)]"
      animate={{ 
        boxShadow: ["0 0 20px rgba(179,136,255,0.2)", "0 0 50px rgba(179,136,255,0.4)", "0 0 20px rgba(179,136,255,0.2)"],
        rotate: [0, 360] 
      }}
      transition={{ 
        boxShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 20, repeat: Infinity, ease: "linear" }
      }}
    >
      <div className="w-40 h-40 md:w-56 md:h-56 rounded-full bg-background/50 backdrop-blur-sm" />
    </motion.div>
  );
}
