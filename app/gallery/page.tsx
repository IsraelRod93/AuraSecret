"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { CompanionCard } from "@/components/companion-card";
import { PaywallModal } from "@/components/paywall-modal";
import { useTelegram } from "@/components/telegram-provider";

interface Companion {
  id: string;
  name: string;
  type: 'ai' | 'human';
  photo_url: string;
  tagline: string | null;
  description: string | null;
}

export default function GalleryPage() {
  const router = useRouter();
  const { appUser } = useTelegram();
  const [batches, setBatches] = useState<Companion[][]>([]);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  useEffect(() => {
    loadCompanions();
  }, [appUser]);

  const loadCompanions = async () => {
    try {
      const params = new URLSearchParams();
      if (appUser?.id) params.set('userId', appUser.id);
      if (sessionId) params.set('sessionId', sessionId);

      const res = await fetch(`/api/companions?${params}`);
      const data = await res.json();

      if (data.batches) {
        setBatches(data.batches);
        setSessionId(data.sessionId);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (companionId: string) => {
    if (selectedIds.includes(companionId)) {
      setSelectedIds(prev => prev.filter(id => id !== companionId));
      return;
    }

    if (selectedIds.length >= 2) return;

    setSelectedIds(prev => [...prev, companionId]);
  };

  const handleNext = () => {
    if (currentBatch < batches.length - 1) {
      setCurrentBatch(prev => prev + 1);
    } else {
      setShowPaywall(true);
    }
  };

  const handleContinueToChat = () => {
    if (selectedIds.length === 0) return;
    router.push(`/chat/${selectedIds[0]}`);
  };

  const handlePayForMore = async () => {
    setPayLoading(true);
    try {
      const res = await fetch('/api/gallery-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: appUser?.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // ignore
    } finally {
      setPayLoading(false);
    }
  };

  const currentCompanions = batches[currentBatch] || [];
  const totalBatches = batches.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CelestialBackground />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
          <p className="font-serif text-lg text-muted-foreground italic">
            Buscando tus conexiones...
          </p>
        </motion.div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CelestialBackground />
        <div className="text-center relative z-10 p-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <p className="font-serif text-xl text-foreground mb-2">Aun no hay conexiones disponibles</p>
          <p className="text-muted-foreground text-sm">Vuelve pronto, el destino prepara algo especial</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <CelestialBackground />

      <div className="relative z-10 p-4 max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          className="text-center py-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-3xl text-gradient-mystical mb-2">
            Elige tu conexion
          </h1>
          <p className="text-muted-foreground text-sm">
            Grupo {currentBatch + 1} de {totalBatches}
            {selectedIds.length > 0 && ` • ${selectedIds.length}/2 seleccionadas`}
          </p>
        </motion.div>

        {/* Companion cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBatch}
            className="grid grid-cols-1 gap-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {currentCompanions.map((companion) => (
              <CompanionCard
                key={companion.id}
                companion={companion}
                onSelect={handleSelect}
                selected={selectedIds.includes(companion.id)}
                disabled={selectedIds.length >= 2 && !selectedIds.includes(companion.id)}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Action buttons */}
        <div className="mt-6 space-y-3 pb-24">
          {selectedIds.length > 0 && (
            <motion.button
              className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-lg"
              onClick={handleContinueToChat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
            >
              Comenzar a chatear
            </motion.button>
          )}

          <button
            className="w-full py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all flex items-center justify-center gap-2"
            onClick={handleNext}
          >
            {currentBatch < totalBatches - 1 ? (
              <>Ver siguiente grupo <ChevronRight className="w-4 h-4" /></>
            ) : (
              <>Ver mas opciones <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPay={handlePayForMore}
        loading={payLoading}
        title="El destino tiene mas para ti"
        description="Desbloquea mas conexiones especiales y encuentra a la indicada"
        price="$15 MXN"
        buttonText="VER MAS OPCIONES"
      />
    </div>
  );
}
