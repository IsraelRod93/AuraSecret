"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, MessageCircle, Heart, Infinity, Crown, Check } from "lucide-react";

interface SubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSubscribe: (plan: 'weekly' | 'monthly') => void;
  loading?: boolean;
  companionName?: string;
  companionPhoto?: string;
}

export function SubscriptionModal({ open, onClose, onSubscribe, loading, companionName, companionPhoto }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');

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
                : 'Desbloquea mensajes ilimitados'}
            </h3>
            <p className="text-muted-foreground text-sm mb-5">
              No dejes que esta conexion se pierda
            </p>

            <div className="space-y-2 mb-5 text-left">
              <div className="flex items-center gap-3 text-foreground/80">
                <Infinity className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Mensajes ilimitados con TODAS tus conexiones</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Respuestas mas profundas y personalizadas</span>
              </div>
              <div className="flex items-center gap-3 text-foreground/80">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">Acceso prioritario a nuevas conexiones</span>
              </div>
            </div>

            {/* Plan selector */}
            <div className="space-y-2 mb-5">
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'monthly' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {selectedPlan === 'monthly' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">Mensual</span>
                      <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">AHORRA 37%</span>
                    </div>
                    <span className="text-xs text-muted-foreground">30 dias de acceso total</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">1,100 Stars</div>
                  <div className="text-[10px] text-muted-foreground line-through">1,400 Stars</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedPlan('weekly')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  selectedPlan === 'weekly'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === 'weekly' ? 'border-primary bg-primary' : 'border-muted-foreground'
                  }`}>
                    {selectedPlan === 'weekly' && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold text-foreground">Semanal</span>
                    <br />
                    <span className="text-xs text-muted-foreground">7 dias de acceso</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">350 Stars</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => onSubscribe(selectedPlan)}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-pink-500 text-white py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'SUSCRIBIRME AHORA'}
            </button>

            <button
              onClick={onClose}
              className="mt-3 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              Quizas despues
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
