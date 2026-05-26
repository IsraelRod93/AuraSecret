"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Star, Sparkles, Send, MapPin, Shield, Zap } from "lucide-react";
import { CelestialBackground } from "@/components/celestial-background";
import { PaywallModal } from "@/components/paywall-modal";
import { useTelegram } from "@/components/telegram-provider";
import { payWithTelegram } from "@/lib/open-payment";

interface Companion {
  id: string;
  name: string;
  type: "ai" | "human";
  photo_url: string;
  tagline: string | null;
  description: string | null;
  age?: number | null;
  location?: string | null;
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
  const [loading, setLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [payLoading, setPayLoading] = useState(false);
  const [showMatch, setShowMatch] = useState<Companion | null>(null);
  const [dragX, setDragX] = useState(0);
  const [referralLink, setReferralLink] = useState<string | null>(null);
  const isDown = useRef(false);
  const startX = useRef(0);

  useEffect(() => {
    loadCompanions();
    if (appUser?.id) {
      fetch('/api/referral')
        .then(r => r.json())
        .then(d => { if (d.referralLink) setReferralLink(d.referralLink); })
        .catch(() => {});
    }
  }, [appUser]);

  const loadCompanions = async () => {
    try {
      const params = new URLSearchParams();
      if (appUser?.id) params.set("userId", appUser.id);
      if (searchParams.get("filtered") === "true") params.set("filtered", "true");
      const res = await fetch(`/api/companions?${params}`);
      const data = await res.json();
      if (data.paywall) {
        setShowPaywall(true);
        setCompanions([]);
        return;
      }
      const all = data.batches?.flat() || [];
      setCompanions(all);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const current = companions[currentIndex];
  const next = companions[currentIndex + 1];
  const remaining = companions.length - currentIndex;

  const advanceCard = useCallback(
    (dir: 1 | -1) => {
      setDragX(dir * 500);
      setTimeout(() => {
        if (dir === 1 && current) {
          setLiked((prev) => [...prev, current]);
          if (appUser?.id) {
            fetch("/api/like", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: appUser.id, companionId: current.id }),
            }).catch(() => {});
          }
          setShowMatch(current);
        }
        setCurrentIndex((i) => i + 1);
        setDragX(0);
      }, 220);
    },
    [current, appUser],
  );

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDown.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    startX.current = clientX;
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDown.current) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragX(clientX - startX.current);
  };
  const onUp = () => {
    isDown.current = false;
    const dir = dragX > 100 ? 1 : dragX < -100 ? -1 : 0;
    if (dir !== 0) {
      advanceCard(dir as 1 | -1);
    } else {
      setDragX(0);
    }
  };

  const handleShare = () => {
    if (!referralLink) return;
    const tg = (window as any).Telegram?.WebApp;
    const shareText = 'Unete a AuraSecret — conexiones exclusivas te esperan';
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`);
    } else {
      navigator.clipboard.writeText(referralLink)
        .then(() => alert('Link copiado al portapapeles'))
        .catch(() => {});
    }
  };

  const handlePayForMore = async () => {
    setPayLoading(true);
    try {
      const paid = await payWithTelegram({ type: "subscription", userId: appUser?.id || undefined, plan: "monthly" });
      if (paid) {
        await loadCompanions();
        setShowPaywall(false);
        setCurrentIndex(0);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error de conexion.");
    } finally {
      setPayLoading(false);
    }
  };

  const rot = dragX / 18;
  const opa = Math.min(1, 1 - Math.abs(dragX) / 600);
  const likeOpacity = Math.max(0, Math.min(1, dragX / 100));
  const nopeOpacity = Math.max(0, Math.min(1, -dragX / 100));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CelestialBackground />
        <div className="text-center relative z-10">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 animate-pulse" />
          <p className="font-serif text-lg text-muted-foreground italic">Buscando tus conexiones...</p>
        </div>
      </div>
    );
  }

  if (companions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <CelestialBackground />
        <div className="text-center relative z-10 p-8">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
          <p className="font-serif text-xl text-foreground mb-2">Aun no hay conexiones</p>
          <p className="text-muted-foreground text-sm">Vuelve pronto, el destino prepara algo especial</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <CelestialBackground />

      <div className="relative z-10 flex flex-col page-content-inset pb-[100px] min-h-screen">
        {/* Header */}
        <div className="text-center mb-3.5">
          <h1 className="font-serif text-[26px] gradient-text tracking-wide">Descubre</h1>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {remaining > 0 ? `${remaining} conexiones` : "Sin mas opciones"}
            {" · "}
            {liked.length} favorita{liked.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Card stack */}
        <div className="flex-1 relative max-h-[480px]">
          {!current ? (
            <div className="absolute inset-0 rounded-[26px] glass-card flex flex-col items-center justify-center p-8">
              {liked.length > 0 ? (
                <>
                  <Heart className="w-10 h-10 mb-3.5" style={{ color: "var(--pink)" }} fill="var(--pink)" />
                  <p className="font-serif text-[22px] mb-1.5">
                    Tienes {liked.length} favoritas
                  </p>
                  <p className="text-[13px] text-muted-foreground mb-4">
                    Escribeles cuando quieras desde Chats
                  </p>
                  <button
                    className="btn-primary w-full text-center"
                    onClick={() => router.push(`/chat/${liked[0]?.id}`)}
                  >
                    Enviar primer mensaje
                  </button>
                </>
              ) : (
                <>
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="font-serif text-xl text-foreground text-center mb-4">
                    No encontraste a nadie?
                  </p>
                  <button className="btn-primary w-full text-center" onClick={() => setShowPaywall(true)}>
                    Desbloquear mas opciones
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Next card behind */}
              {next && (
                <div
                  className="absolute inset-0 rounded-[26px] overflow-hidden"
                  style={{ transform: "scale(0.93) translateY(8px)", opacity: 0.55 }}
                >
                  <img src={next.photo_url} alt="" className="w-full h-full object-cover" draggable={false} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                </div>
              )}

              {/* Current card */}
              <div
                className="absolute inset-0 rounded-[26px] overflow-hidden cursor-grab"
                style={{
                  transform: `translateX(${dragX}px) rotate(${rot}deg)`,
                  opacity: opa,
                  transition: isDown.current ? "none" : "transform 0.22s ease, opacity 0.22s ease",
                  touchAction: "none",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                }}
                onMouseDown={onDown}
                onMouseMove={onMove}
                onMouseUp={onUp}
                onMouseLeave={onUp}
                onTouchStart={onDown}
                onTouchMove={onMove}
                onTouchEnd={onUp}
              >
                <img src={current.photo_url} alt={current.name} className="w-full h-full object-cover pointer-events-none" draggable={false} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Type badge */}
                <div className="absolute top-3 right-3">
                  <div
                    className="px-2.5 py-1 rounded-full flex items-center gap-1 text-[10px] font-semibold text-white"
                    style={{
                      backdropFilter: "blur(8px)",
                      background: current.type === "ai" ? "oklch(0.55 0.18 300 / 0.75)" : "oklch(0.65 0.20 0 / 0.75)",
                    }}
                  >
                    {current.type === "ai" ? <Sparkles size={11} /> : <Heart size={11} fill="white" />}
                    {current.type === "ai" ? "IA" : "Real"}
                  </div>
                </div>

                {/* NOPE indicator */}
                <div
                  className="absolute top-7 left-7 px-3.5 py-1.5 rounded-[10px] font-extrabold text-[22px] tracking-wider"
                  style={{
                    border: "3px solid oklch(0.70 0.20 25)",
                    color: "oklch(0.70 0.20 25)",
                    transform: "rotate(-18deg)",
                    opacity: nopeOpacity,
                    background: "oklch(0 0 0 / 0.3)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  NOPE
                </div>

                {/* LIKE indicator */}
                <div
                  className="absolute top-7 right-7 px-3.5 py-1.5 rounded-[10px] font-extrabold text-[22px] tracking-wider"
                  style={{
                    border: "3px solid oklch(0.75 0.18 155)",
                    color: "oklch(0.75 0.18 155)",
                    transform: "rotate(18deg)",
                    opacity: likeOpacity,
                    background: "oklch(0 0 0 / 0.3)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  LIKE
                </div>

                {/* Chips at bottom */}
                <div className="absolute bottom-[62px] left-3.5 right-3.5 z-[3] flex gap-1.5 flex-wrap">
                  {current.location && (
                    <span className="chip"><MapPin size={10} /> {current.location}</span>
                  )}
                  {current.type === "human" && (
                    <span className="chip-pink"><Shield size={10} /> Verificada</span>
                  )}
                  <span className="chip-gold"><Zap size={10} /> Activa ahora</span>
                </div>

                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5 pb-4 z-[2]">
                  <h2 className="font-serif text-[22px] text-white font-medium leading-tight">
                    {current.name}{current.age ? `, ${current.age}` : ""}
                  </h2>
                  {current.tagline && (
                    <p className="text-white/70 text-[11px] mt-0.5 italic">{current.tagline}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        {current && (
          <div className="flex justify-center items-center gap-4 mt-3.5 mb-1">
            <button
              onClick={() => advanceCard(-1)}
              className="w-14 h-14 rounded-full grid place-items-center cursor-pointer"
              style={{
                border: "2px solid oklch(0.65 0.18 25 / 0.45)",
                background: "oklch(0.10 0.02 285 / 0.65)",
                backdropFilter: "blur(10px)",
                color: "oklch(0.75 0.20 25)",
              }}
            >
              <X size={22} />
            </button>
            <button
              className="w-[46px] h-[46px] rounded-full grid place-items-center cursor-pointer"
              style={{
                border: "2px solid oklch(0.65 0.18 220 / 0.45)",
                background: "oklch(0.10 0.02 285 / 0.65)",
                backdropFilter: "blur(10px)",
                color: "oklch(0.78 0.16 220)",
              }}
            >
              <Star size={18} />
            </button>
            <button
              onClick={() => advanceCard(1)}
              className="w-16 h-16 rounded-full grid place-items-center cursor-pointer border-none"
              style={{
                background: "linear-gradient(135deg, oklch(0.74 0.18 0), oklch(0.65 0.18 320))",
                color: "white",
                boxShadow: "0 14px 30px oklch(0.55 0.16 320 / 0.45)",
              }}
            >
              <Heart size={26} fill="white" />
            </button>
          </div>
        )}
      </div>

      {/* Match overlay */}
      <AnimatePresence>
        {showMatch && (
          <motion.div
            className="fixed inset-0 z-[60] p-7 grid place-items-center"
            style={{ background: "oklch(0 0 0 / 0.75)", backdropFilter: "blur(16px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="text-center max-w-[280px]">
              <div className="grid place-items-center animate-pop">
                <Heart size={68} fill="oklch(0.74 0.18 0)" stroke="oklch(0.74 0.18 0)" />
              </div>
              <h2 className="font-serif text-[32px] gradient-text mt-3">¡Es match!</h2>
              <p className="text-white/70 text-sm mt-1.5 mb-6">
                A {showMatch.name} tambien le gustaste
              </p>
              <button
                className="btn-primary w-full text-center mb-2.5"
                onClick={() => {
                  setShowMatch(null);
                  router.push(`/chat/${showMatch.id}`);
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <Send size={14} /> Enviar mensaje
                </span>
              </button>
              <button
                className="btn-ghost w-full text-center"
                onClick={() => setShowMatch(null)}
              >
                Seguir viendo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PaywallModal
        open={showPaywall}
        onClose={() => setShowPaywall(false)}
        onPay={handlePayForMore}
        loading={payLoading}
        title="El destino tiene mas para ti"
        description="Mensajes ilimitados + perfiles ilimitados por 30 dias"
        price="250 Stars (~$87 MXN)"
        buttonText="SUSCRIBIRME — 250 ★"
        referralLink={referralLink || undefined}
        onShare={referralLink ? handleShare : undefined}
      />
    </div>
  );
}
