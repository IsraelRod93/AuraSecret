"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Infinity, Crown, Images } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
  companionName?: string;
  companionPhoto?: string;
}

export function SubscriptionModal({ open, onClose, onSubscribe, loading, companionName, companionPhoto }: SubscriptionModalProps) {
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
            className="relative glass-card rounded-2xl p-6 max-w-sm w-full text-center border border-primary/30"
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

            {companionPhoto ? (
              <div className="relative w-16 h-16 mx-auto mb-3">
                <img
                  src={companionPhoto}
                  alt={companionName || ""}
                  className="w-16 h-16 rounded-full object-cover mx-auto"
                  style={{ border: "2px solid var(--primary-soft)" }}
                />
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full grid place-items-center"
                  style={{ background: "var(--gold)" }}
                >
                  <Crown className="w-3 h-3 text-white" />
                </div>
              </div>
            ) : (
              <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            )}

            <h3 className="font-serif text-2xl text-foreground mb-1">
              {companionName
                ? `Sigue hablando con ${companionName}`
                : 'Desbloquea el acceso total'}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              Un mes completo de conexiones sin límites
            </p>

            <div className="space-y-2 mb-5 text-left">
              <div className="flex items-center gap-3 text-foreground/80">
                <Infinity className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Mensajes ilimitados con todas tus conexiones</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Images className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Perfiles ilimitados en la galería</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Respuestas más profundas y personalizadas</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Acceso prioritario a nuevas conexiones</span>
              </div>
            </div>

            {/* Price */}
            <div
              className="w-full flex items-center justify-between p-4 rounded-xl mb-5"
              style={{ background: "oklch(0.55 0.18 300 / 0.12)", border: "2px solid var(--primary)" }}
            >
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Premium mensual</p>
                <p className="text-xs text-muted-foreground">30 días de acceso total</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">250 ★</p>
                <p className="text-[11px] text-muted-foreground">~$87 MXN</p>
              </div>
            </div>

            <button
              onClick={onSubscribe}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'SUSCRIBIRME — 250 ★'}
            </button>

            <button
              onClick={onClose}
              className="mt-3 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              Quizás después
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
