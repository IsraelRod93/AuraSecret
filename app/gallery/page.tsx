"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, Sparkles, MessageCircle } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { PaywallModal } from "@/components/paywall-modal";
import { useTelegram } from "@/components/telegram-provider";
import { openPaymentLink } from "@/lib/open-payment";

interface Companion {
  id: string;
  name: string;
  type: 'ai' | 'human';
  photo_url: string;
  tagline: string | null;
  description: string | null;
}

export default function GalleryPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <GalleryPage />
    </Suspense>
  );
}

function GalleryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { appUser } = useTelegram();
  const [companions, setCompanions] = useState<Companion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [liked, setLiked] = useState<Companion[]>([]);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showMatch, setShowMatch] = useState<Companion | null>(null);

  useEffect(() => {
    loadCompanions();
  }, [appUser]);

  const loadCompanions = async () => {
    try {
      const params = new URLSearchParams();
      if (appUser?.id) params.set('userId', appUser.id);
      if (searchParams.get('filtered') === 'true') params.set('filtered', 'true');
      const res = await fetch(`/api/companions?${params}`);
      const data = await res.json();
      const all = data.batches?.flat() || [];
      setCompanions(all);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (swipeDir: 'left' | 'right') => {
    if (currentIndex >= companions.length) return;

    const current = companions[currentIndex];
    setDirection(swipeDir);

    if (swipeDir === 'right' && liked.length < 2) {
      setLiked(prev => [...prev, current]);
      if (appUser?.id) {
        fetch('/api/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: appUser.id, companionId: current.id }),
        }).catch(() => {});
      }
      setTimeout(() => {
        setShowMatch(current);
      }, 400);
    }

    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
      setDirection(null);

      if (currentIndex + 1 >= companions.length && liked.length === 0) {
        setShowPaywall(true);
      }
    }, 300);
  };

  const handlePayForMore = async () => {
    setPayLoading(true);
    try {
      const res = await fetch('/api/gallery-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: appUser?.id || 'anonymous' }),
      });
      const data = await res.json();
      if (data.url) {
        openPaymentLink(data.url);
      } else {
        alert(data.error || 'Error al procesar el pago');
      }
    } catch (e) {
      alert('Error de conexion. Intenta de nuevo.');
    } finally {
      setPayLoading(false);
    }
  };

  const current = companions[currentIndex];
  const next = companions[currentIndex + 1];
  const remaining = companions.length - currentIndex;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CelestialBackground />
        <motion.div className="text-center relative z-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
          <p className="font-serif text-lg text-muted-foreground italic">Buscando tus conexiones...</p>
        </motion.div>
      </div>
    );
  }

  if (companions.length === 0) {
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CelestialBackground />

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-24">
        {/* Header */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-serif text-2xl text-gradient-mystical">Descubre</h1>
          <p className="text-muted-foreground text-xs mt-1">
            {remaining > 0 ? `${remaining} conexiones restantes` : 'Sin mas opciones'}
            {liked.length > 0 && ` • ${liked.length} favorita${liked.length > 1 ? 's' : ''}`}
          </p>
        </motion.div>

        {/* Card stack */}
        <div className="relative h-[65vh] max-h-[500px]">
          {/* Next card (behind) */}
          {next && (
            <div className="absolute inset-0 rounded-3xl overflow-hidden scale-[0.95] opacity-50">
              <img src={next.photo_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40" />
            </div>
          )}

          {/* Current card */}
          <AnimatePresence mode="wait">
            {current ? (
              <SwipeCard
                key={current.id}
                companion={current}
                onSwipe={handleSwipe}
                direction={direction}
              />
            ) : (
              <motion.div
                className="absolute inset-0 rounded-3xl glass-card flex flex-col items-center justify-center p-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {liked.length > 0 ? (
                  <>
                    <Heart className="w-12 h-12 text-pink-400 mb-4" fill="currentColor" />
                    <p className="font-serif text-xl text-foreground text-center mb-2">
                      {liked.length === 1 ? 'Elegiste a' : 'Elegiste a'}
                    </p>
                    <div className="space-y-2 mb-6">
                      {liked.map(c => (
                        <button
                          key={c.id}
                          onClick={() => router.push(`/chat/${c.id}`)}
                          className="flex items-center gap-3 w-full bg-primary/10 border border-primary/30 rounded-xl p-3"
                        >
                          <img src={c.photo_url} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                          <span className="font-medium text-foreground">{c.name}</span>
                          <MessageCircle className="w-4 h-4 text-primary ml-auto" />
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowPaywall(true)}
                      className="text-muted-foreground text-sm underline"
                    >
                      Ver mas opciones
                    </button>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="font-serif text-xl text-foreground text-center mb-4">
                      No encontraste a nadie?
                    </p>
                    <button
                      onClick={() => setShowPaywall(true)}
                      className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold"
                    >
                      Desbloquear mas opciones
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swipe indicators */}
          <AnimatePresence>
            {direction === 'left' && (
              <motion.div
                className="absolute top-8 left-8 z-30 border-4 border-red-500 rounded-xl px-4 py-2 rotate-[-20deg]"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-red-500 font-black text-2xl">NOPE</span>
              </motion.div>
            )}
            {direction === 'right' && (
              <motion.div
                className="absolute top-8 right-8 z-30 border-4 border-green-400 rounded-xl px-4 py-2 rotate-[20deg]"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-green-400 font-black text-2xl">LIKE</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {current && (
          <div className="flex items-center justify-center gap-6 mt-6">
            <motion.button
              className="w-16 h-16 rounded-full border-2 border-red-400/50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('left')}
            >
              <X className="w-7 h-7 text-red-400" />
            </motion.button>

            <motion.button
              className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-primary flex items-center justify-center shadow-lg shadow-primary/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSwipe('right')}
            >
              <Heart className="w-9 h-9 text-white" fill="white" />
            </motion.button>
          </div>
        )}
      </div>

      {/* Match overlay */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <motion.div
                animate={{ rotate: [0, -5, 5, -5, 0] }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Heart className="w-16 h-16 text-pink-400 mx-auto mb-4" fill="currentColor" />
              </motion.div>
              <h2 className="font-serif text-3xl text-white mb-2">Te gusta!</h2>
              <p className="text-white/60 mb-6">Agregaste a {showMatch.name} a tus favoritas</p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    router.push(`/chat/${showMatch.id}`);
                  }}
                  className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold"
                >
                  Enviar mensaje
                </button>
                <button
                  onClick={() => setShowMatch(null)}
                  className="w-full py-3 rounded-xl border border-white/20 text-white/70"
                >
                  Seguir viendo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPay={handlePayForMore}
        loading={payLoading}
        title="El destino tiene mas para ti"
        description="Desbloquea mas conexiones especiales"
        price="$10 MXN"
        buttonText="VER MAS OPCIONES"
      />
    </div>
  );
}

function SwipeCard({ companion, onSwipe, direction }: {
  companion: Companion;
  onSwipe: (dir: 'left' | 'right') => void;
  direction: 'left' | 'right' | null;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 100) {
      onSwipe('right');
    } else if (info.offset.x < -100) {
      onSwipe('left');
    }
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: direction === 'left' ? -400 : direction === 'right' ? 400 : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <img
        src={companion.photo_url}
        alt={companion.name}
        className="w-full h-full object-cover pointer-events-none"
        draggable={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

      {/* Type badge */}
      <div className="absolute top-4 right-4">
        {companion.type === 'ai' ? (
          <div className="bg-primary/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            <span className="text-xs text-primary-foreground font-medium">IA</span>
          </div>
        ) : (
          <div className="bg-pink-500/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-xs text-white font-medium">Real</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h2 className="font-serif text-3xl text-white font-medium">{companion.name}</h2>
        {companion.tagline && (
          <p className="text-white/70 text-sm mt-1 italic">{companion.tagline}</p>
        )}
        {companion.description && (
          <p className="text-white/50 text-xs mt-2">{companion.description}</p>
        )}
      </div>
    </motion.div>
  );
}
