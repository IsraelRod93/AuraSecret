"use client";

import { motion } from "framer-motion";
import { Sparkles, Heart } from "lucide-react";

interface Companion {
  id: string;
  name: string;
  type: 'ai' | 'human';
  photo_url: string;
  tagline: string | null;
  description: string | null;
}

interface CompanionCardProps {
  companion: Companion;
  onSelect: (id: string) => void;
  selected?: boolean;
  disabled?: boolean;
}

export function CompanionCard({ companion, onSelect, selected, disabled }: CompanionCardProps) {
  return (
    <motion.div
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all ${
        selected
          ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(124,77,255,0.4)]'
          : 'border border-border/50'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => !disabled && onSelect(companion.id)}
    >
      <div className="aspect-[3/4] relative">
        <img
          src={companion.photo_url}
          alt={companion.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Type badge */}
        <div className="absolute top-3 right-3">
          {companion.type === 'ai' ? (
            <div className="bg-primary/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
              <span className="text-[10px] text-primary-foreground font-medium">IA</span>
            </div>
          ) : (
            <div className="bg-pink-500/80 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Heart className="w-3 h-3 text-white" />
              <span className="text-[10px] text-white font-medium">Real</span>
            </div>
          )}
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-serif text-xl text-white font-medium">{companion.name}</h3>
          {companion.tagline && (
            <p className="text-white/70 text-sm mt-1 italic">{companion.tagline}</p>
          )}
        </div>

        {/* Selected indicator */}
        {selected && (
          <motion.div
            className="absolute inset-0 bg-primary/10 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-primary text-primary-foreground rounded-full p-3">
              <Heart className="w-6 h-6" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
