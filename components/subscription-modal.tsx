"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Infinity, Crown, Images, Lock } from "lucide-react";

interface VaultThumb {
  thumbnail_url: string | null;
  price: number;
}

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: () => void;
  loading?: boolean;
  companionName?: string;
  companionPhoto?: string;
  vaultPreview?: VaultThumb[];
}

export function SubscriptionModal({ open, onClose, onSubscribe, loading, companionName, companionPhoto, vaultPreview }: SubscriptionModalProps) {
  const hasVault = vaultPreview && vaultPreview.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

          <motion.div
            className="relative glass-card rounded-t-3xl p-6 w-full max-w-lg text-center border-t border-x border-primary/30"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 rounded-full bg-border mx-auto mb-5" />

            <button
              onClick={onClose}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Avatar + heading */}
            <div className="flex flex-col items-center mb-4">
              {companionPhoto ? (
                <div className="relative w-16 h-16 mb-3">
                  <img
                    src={companionPhoto}
                    alt={companionName || ""}
                    className="w-16 h-16 rounded-full object-cover"
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
                <Crown className="w-10 h-10 text-yellow-400 mb-3" />
              )}

              <h3 className="font-serif text-[22px] text-foreground leading-tight">
                {companionName
                  ? `${companionName} tiene más para ti`
                  : 'Desbloquea el acceso total'}
              </h3>
              <p className="text-muted-foreground text-sm mt-1">
                Sigue la conversación y descubre su contenido exclusivo
              </p>
            </div>

            {/* Vault preview — what they're missing */}
            {hasVault && (
              <div className="mb-4">
                <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wider font-semibold">
                  Contenido exclusivo desbloqueado al suscribirte
                </p>
                <div className="flex gap-2 justify-center">
                  {vaultPreview!.map((item, i) => (
                    <div
                      key={i}
                      className="relative rounded-xl overflow-hidden flex-1"
                      style={{
                        aspectRatio: "3/4",
                        maxWidth: 90,
                        border: "1px solid oklch(0.50 0.15 300 / 0.35)",
                      }}
                    >
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt=""
                          className="w-full h-full object-cover"
                          style={{ filter: "blur(8px) saturate(0.6)", transform: "scale(1.12)" }}
                        />
                      ) : (
                        <div className="w-full h-full" style={{ background: "oklch(0.15 0.04 290)" }} />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5"
                        style={{ background: "oklch(0 0 0 / 0.35)" }}>
                        <Lock size={14} className="text-white" />
                        <span className="text-white text-[10px] font-bold">
                          ★{Math.round(item.price / 100)}
                        </span>
                      </div>
                    </div>
                  ))}
                  {/* "más" placeholder if fewer than 3 */}
                  {vaultPreview!.length < 3 && (
                    <div
                      className="relative rounded-xl overflow-hidden flex-1 grid place-items-center"
                      style={{
                        aspectRatio: "3/4",
                        maxWidth: 90,
                        border: "1px dashed oklch(0.50 0.15 300 / 0.35)",
                        background: "oklch(0.12 0.04 290 / 0.6)",
                      }}
                    >
                      <span className="text-muted-foreground text-xs font-semibold">+más</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Benefits */}
            <div className="space-y-2 mb-4 text-left">
              <div className="flex items-center gap-3 text-foreground/80">
                <Infinity className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Mensajes ilimitados con todas tus conexiones</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Images className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Galería completa desbloqueada</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Conversaciones más profundas y personalizadas</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Acceso prioritario a nuevas conexiones</span>
              </div>
            </div>

            {/* Price block */}
            <div
              className="w-full flex items-center justify-between p-3.5 rounded-xl mb-4"
              style={{ background: "oklch(0.55 0.18 300 / 0.12)", border: "2px solid var(--primary)" }}
            >
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">Premium mensual</p>
                <p className="text-xs text-muted-foreground">30 días · cancela cuando quieras</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">250 ★</p>
                <p className="text-[11px] text-muted-foreground">~$87 MXN</p>
              </div>
            </div>

            <button
              onClick={onSubscribe}
              disabled={loading}
              className="w-full text-white py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.62 0.20 330))" }}
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
