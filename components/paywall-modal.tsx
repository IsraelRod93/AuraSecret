"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Eye, Heart, Users } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  price?: string;
  buttonText?: string;
  referralLink?: string;
  onShare?: () => void;
}

export function PaywallModal({
  open,
  onClose,
  onPay,
  loading,
  title = "Hay mas chicas esperando por ti",
  description = "Desbloquea la galeria completa y descubre quien te esta buscando",
  price = "150 Stars",
  buttonText = "DESBLOQUEAR GALERIA",
  referralLink,
  onShare,
}: PaywallModalProps) {
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

            <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
            <h3 className="font-serif text-2xl text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm mb-5">{description}</p>

            <div className="space-y-2 mb-5 text-left">
              <div className="flex items-center gap-3 text-foreground/80">
                <Eye className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Ve perfiles ilimitados</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Heart className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <span className="text-sm">Encuentra tu conexion perfecta</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Users className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Acceso a creadoras reales y IA</span>
              </div>
            </div>

            <div className="text-3xl font-bold text-primary mb-1">{price}</div>
            <p className="text-muted-foreground text-xs mb-5">Suscripcion mensual — Acceso total</p>

            <button
              onClick={onPay}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : buttonText}
            </button>

            {referralLink && onShare && (
              <>
                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="text-xs text-muted-foreground">o</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
                <button
                  onClick={onShare}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all border"
                  style={{
                    border: "1px solid oklch(0.55 0.18 300 / 0.5)",
                    color: "var(--primary)",
                    background: "oklch(0.55 0.18 300 / 0.08)",
                  }}
                >
                  <Users className="w-4 h-4" />
                  Invita 1 amigo y desbloquea gratis
                </button>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  Se desbloquea cuando tu amigo se una
                </p>
              </>
            )}

            <button
              onClick={onClose}
              className="mt-3 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              No gracias
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
