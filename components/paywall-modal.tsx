"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  onPay: () => void;
  loading?: boolean;
  title?: string;
  description?: string;
  price?: string;
  buttonText?: string;
}

export function PaywallModal({
  open,
  onClose,
  onPay,
  loading,
  title = "El destino tiene mas para ti",
  description = "Desbloquea mas conexiones especiales",
  price = "$9 MXN",
  buttonText = "DESBLOQUEAR",
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
            <p className="text-muted-foreground text-sm mb-6">{description}</p>

            <div className="text-3xl font-bold text-primary mb-6">{price}</div>

            <button
              onClick={onPay}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg transition-all hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : buttonText}
            </button>

            <button
              onClick={onClose}
              className="mt-4 text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              No gracias, quizas despues
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
