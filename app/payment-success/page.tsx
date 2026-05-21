"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Sparkles, ArrowRight } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { Suspense } from "react";

const MESSAGES: Record<string, { title: string; subtitle: string }> = {
  subscription: {
    title: "Premium activado!",
    subtitle: "Mensajes ilimitados con todas tus conexiones",
  },
  gallery: {
    title: "Desbloqueado!",
    subtitle: "Aura te ayudara a encontrar tu conexion ideal",
  },
  vault: {
    title: "Compra exitosa!",
    subtitle: "Tu contenido exclusivo esta listo",
  },
};

function PaymentContent() {
  const params = useSearchParams();
  const type = params.get("type") || "subscription";
  const msg = MESSAGES[type] || MESSAGES.subscription;
  const isGallery = type === 'gallery';
  const botUrl = "https://t.me/AuraSecretx_bot";
  const nextUrl = isGallery ? "/preferences" : botUrl;

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center">
      <CelestialBackground />

      <motion.div
        className="relative z-10 text-center p-8 max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 10, delay: 0.2 }}
        >
          <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
        </motion.div>

        <h1 className="font-serif text-3xl text-foreground mb-2">{msg.title}</h1>
        <p className="text-muted-foreground mb-8">{msg.subtitle}</p>

        <motion.a
          href={nextUrl}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isGallery ? 'Dile a Aura que buscas' : 'Volver a Aura'} <ArrowRight className="w-5 h-5" />
        </motion.a>

        <motion.div
          className="mt-6 flex items-center justify-center gap-2 text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm">El destino te sonrie</span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PaymentContent />
    </Suspense>
  );
}
