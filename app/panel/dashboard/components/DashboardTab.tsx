"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, TrendingUp, Users, ShoppingBag, Zap } from "lucide-react";
import { Companion, Stats, Sale, fmt } from "./types";
import { LoadingSpinner, ShareLinkCard, OnboardingCard, FanChannelCard, ReferralBonusCard } from "./shared";

const POLL_INTERVAL = 30_000;

export function DashboardTab({ companion }: { companion: Companion }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSale, setNewSale] = useState(false);
  const prevSalesRef = useRef(0);

  const fetchDashboard = useCallback(async (initial = false) => {
    try {
      const res = await fetch('/api/dashboard');
      const d = await res.json();
      const incoming: Stats = d.stats;
      const incomingSales: Sale[] = d.recentSales || [];

      if (!initial && prevSalesRef.current > 0 && incoming.totalSales > prevSalesRef.current) {
        setNewSale(true);
        setTimeout(() => setNewSale(false), 3500);
      }

      prevSalesRef.current = incoming.totalSales;
      setStats(incoming);
      setSales(incomingSales);
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(true);
    const id = setInterval(() => fetchDashboard(false), POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchDashboard]);

  if (loading) return <LoadingSpinner />;

  const profileComplete = !!(companion.tagline && companion.description && companion.age && companion.location);
  const hasContent = (stats?.totalItems || 0) > 0;
  const showOnboarding = !profileComplete || !hasContent;

  const earnings = stats ? Math.round(stats.totalRevenue * 0.8) : 0;
  const weekEarnings = stats ? Math.round(stats.weekRevenue * 0.8) : 0;
  const monthGrowth = stats?.monthGrowth ?? 0;
  const referralBonus = stats?.referralBonus ?? 0;
  const referralUsers = stats?.referralUsers ?? 0;

  const weekData = stats?.weekDaily?.length === 7
    ? stats.weekDaily.map((c) => Math.round(c * 0.8))
    : [0, 0, 0, 0, 0, 0, 0];
  const weekMax = Math.max(...weekData, 1);
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3.5">
      {/* New sale flash */}
      <AnimatePresence>
        {newSale && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="flex items-center gap-2.5 rounded-[14px] px-4 py-2.5"
            style={{
              background: "linear-gradient(135deg, oklch(0.30 0.16 155 / 0.35), oklch(0.20 0.12 155 / 0.45))",
              border: "1px solid oklch(0.65 0.16 155 / 0.50)",
            }}
          >
            <Zap size={14} style={{ color: "var(--green)" }} />
            <p className="text-sm font-semibold" style={{ color: "var(--green)" }}>¡Nueva venta! 🎉</p>
            <span className="text-[10px] text-muted-foreground ml-auto">ahora mismo</span>
          </motion.div>
        )}
      </AnimatePresence>

      {showOnboarding && (
        <OnboardingCard profileComplete={profileComplete} hasContent={hasContent} />
      )}

      {/* Hero earnings card */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.16 155 / 0.20), oklch(0.18 0.08 295 / 0.40))",
          border: "1px solid oklch(0.65 0.16 155 / 0.30)",
          borderRadius: 22, padding: 22,
        }}
      >
        <div
          className="absolute pointer-events-none"
          style={{ top: -20, right: -20, width: 160, height: 160, borderRadius: "50%", background: "radial-gradient(circle, oklch(0.70 0.16 155 / 0.18), transparent 70%)" }}
        />
        {/* Live indicator */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--green)" }} />
          <span className="text-[9px]" style={{ color: "var(--green)" }}>EN VIVO</span>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Has ganado este mes</p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[44px] font-medium leading-none" style={{ color: "var(--green)" }}>
            ★{fmt(earnings)}
          </span>
          <span className="text-[13px] text-muted-foreground">Stars</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2.5">
          <span className="chip-green">
            <TrendingUp size={11} />
            {monthGrowth >= 0 ? `+${monthGrowth}%` : `${monthGrowth}%`}
          </span>
          <span className="text-[11px] text-muted-foreground">vs mes pasado</span>
        </div>
        <div className="flex items-end gap-[5px] mt-[18px]" style={{ height: 50 }}>
          {weekData.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-[4px] transition-colors"
                style={{
                  height: `${(v / weekMax) * 100}%`,
                  background: i === weekData.length - 1
                    ? "linear-gradient(180deg, var(--green), oklch(0.55 0.15 155))"
                    : "oklch(0.40 0.10 285 / 0.5)",
                }}
              />
              <span className="text-[9px]" style={{ color: i === weekData.length - 1 ? "var(--green)" : "var(--fg-muted)" }}>
                {dayLabels[i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: ShoppingBag, color: "var(--gold)", n: stats?.totalSales || 0, label: "ventas" },
          { icon: Users, color: "oklch(0.78 0.16 220)", n: stats?.uniqueClients || 0, label: "clientes" },
          { icon: TrendingUp, color: "var(--pink)", n: `★${fmt(weekEarnings)}`, label: "esta semana" },
        ].map((s, i) => (
          <div key={i} className="solid-card rounded-[14px] p-3 text-center">
            <s.icon size={16} style={{ color: s.color, margin: "0 auto" }} />
            <p className="font-serif text-xl font-medium mt-1">{s.n}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <ShareLinkCard companionId={companion.id} />
      <FanChannelCard companionId={companion.id} />
      {referralBonus > 0 && (
        <ReferralBonusCard bonusStars={referralBonus} referralUsers={referralUsers} />
      )}

      {/* Recent sales */}
      <div>
        <div className="flex items-baseline justify-between mb-2.5">
          <h3 className="font-serif text-[17px] text-foreground">Ventas recientes</h3>
          {sales.length > 0 && <span className="text-[11px] text-primary cursor-pointer">Ver todas</span>}
        </div>
        {sales.length === 0 ? (
          <div className="text-center py-8 solid-card rounded-[14px]">
            <ShoppingBag className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Aun no tienes ventas</p>
            <p className="text-xs text-muted-foreground mt-1">Sube fotos y comparte tu enlace</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {sales.map((sale, i) => (
              <div key={i} className="solid-card rounded-[14px] p-2.5 flex items-center gap-2.5">
                <div
                  className="grid place-items-center flex-shrink-0"
                  style={{ width: 32, height: 32, borderRadius: 10, background: "var(--green-soft)", color: "var(--green)" }}
                >
                  <Star size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium">{sale.title || 'Contenido'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {sale.first_name || sale.username || 'Anonimo'} · {new Date(sale.created_at).toLocaleDateString('es-MX')}
                  </p>
                </div>
                <span className="font-serif text-base font-medium" style={{ color: "var(--green)" }}>
                  +★{fmt(Math.round(sale.amount * 0.8))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex items-center gap-3"
        style={{
          background: "linear-gradient(135deg, oklch(0.55 0.18 300 / 0.10), oklch(0.45 0.20 320 / 0.08))",
          border: "1px solid var(--primary-soft)",
          borderRadius: 16, padding: 14,
        }}
      >
        <div
          className="grid place-items-center flex-shrink-0"
          style={{ width: 36, height: 36, borderRadius: 10, background: "var(--primary-soft)", color: "oklch(0.85 0.10 300)" }}
        >
          <Sparkles size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: "oklch(0.85 0.10 300)" }}>Tip de Aura</p>
          <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
            Sube 3 fotos hoy y duplica tus visitas este fin de semana
          </p>
        </div>
      </div>
    </motion.div>
  );
}
