"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Heart, Infinity } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
  companionName?: string;
}

export function SubscriptionModal({ open, onClose, onSubscribe, loading, companionName }: SubscriptionModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative glass-card rounded-2xl p-8 max-w-sm w-full text-center border border-primary/30"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4" fill="currentColor" />
            <h3 className="font-serif text-2xl text-foreground mb-2">
              {companionName ? `Tu conexion con ${companionName} es especial` : 'Desbloquea mensajes ilimitados'}
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              No dejes que esta conexion se pierda
            </p>

            <div className="space-y-3 mb-6 text-left">
              <div className="flex items-center gap-3 text-foreground/80">
                <Infinity className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">Mensajes ilimitados con TODAS tus conexiones</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <MessageCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">Respuestas mas profundas y personalizadas</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">Acceso prioritario a nuevas conexiones</span>
              </div>
            </div>

            <div className="text-3xl font-bold text-primary mb-1">350 Stars</div>
            <p className="text-muted-foreground text-xs mb-6">Acceso Premium Semanal • Mensajes Ilimitados</p>

            <button
              onClick={onSubscribe}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'SUSCRIBIRME'}
            </button>

            <button
              onClick={onClose}
              className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Quizas despues
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
