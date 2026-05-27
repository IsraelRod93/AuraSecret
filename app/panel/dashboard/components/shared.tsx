"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Check, Copy, Share2, Link2, Megaphone, Users } from "lucide-react";
import { useState } from "react";
import { fmt } from "./types";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Sparkles className="text-primary animate-pulse" size={24} />
    </div>
  );
}

export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-card rounded-t-2xl sm:rounded-2xl p-6 pb-24 sm:pb-6 w-full max-w-sm border border-border max-h-[85vh] overflow-y-auto relative"
        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground">
          <X size={20} />
        </button>
        {children}
      </motion.div>
    </motion.div>
  );
}

export function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-primary text-xs flex items-center gap-1">{icon}{label}</label>
      {children}
    </div>
  );
}

export function ShareLinkCard({ companionId }: { companionId: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://t.me/AuraSecretx_bot?start=crea_${companionId}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement('input');
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'AuraSecret', text: 'Descubre mi contenido exclusivo en AuraSecret', url: link }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary/20 to-pink-500/10 border border-primary/30 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Link2 className="w-4 h-4 text-primary" />
        <h3 className="font-serif text-sm text-foreground font-medium">Tu link para fans</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Comparte este link en Instagram, TikTok o Twitter para traer fans directamente a tu chat
      </p>
      <div className="bg-background/60 rounded-lg p-2.5 flex items-center gap-2 mb-3">
        <code className="text-[10px] text-foreground/80 flex-1 break-all">{link}</code>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-border rounded-lg py-2 text-sm text-foreground hover:bg-card/80 transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button
          onClick={shareLink}
          className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-sm font-medium"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </button>
      </div>
    </div>
  );
}

export function FanChannelCard({ companionId }: { companionId: string }) {
  const [copied, setCopied] = useState(false);
  const link = `https://t.me/AuraSecretx_bot?start=fan_${companionId}`;

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(link); }
    catch {
      const input = document.createElement('input');
      input.value = link; document.body.appendChild(input); input.select();
      document.execCommand('copy'); document.body.removeChild(input);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = async () => {
    if (navigator.share) {
      await navigator.share({ title: 'Mi canal de fans', url: link }).catch(() => {});
    } else {
      copyLink();
    }
  };

  return (
    <div
      className="rounded-[18px] p-4"
      style={{
        background: "linear-gradient(135deg, oklch(0.55 0.20 30 / 0.10), oklch(0.45 0.18 50 / 0.08))",
        border: "1px solid oklch(0.75 0.18 40 / 0.30)",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Megaphone size={14} style={{ color: "oklch(0.85 0.18 40)" }} />
        <h3 className="text-xs font-semibold" style={{ color: "oklch(0.85 0.18 40)" }}>Canal de fans</h3>
      </div>
      <p className="text-[11px] text-muted-foreground mb-3">
        Postea este link en tu canal o grupo de Telegram. Cuando entren, el bot les muestra un teaser de tu contenido y los lleva directo a tu chat.
      </p>
      <div className="bg-background/60 rounded-lg p-2 mb-3">
        <code className="text-[10px] text-foreground/80 break-all">{link}</code>
      </div>
      <div className="flex gap-2">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 bg-card border border-border rounded-lg py-2 text-sm text-foreground"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
        <button
          onClick={shareLink}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, oklch(0.70 0.18 40), oklch(0.65 0.18 55))" }}
        >
          <Share2 className="w-3.5 h-3.5" />
          Compartir
        </button>
      </div>
    </div>
  );
}

export function ReferralBonusCard({ bonusStars, referralUsers }: { bonusStars: number; referralUsers: number }) {
  return (
    <div
      className="rounded-[18px] p-4 flex items-center gap-3"
      style={{
        background: "linear-gradient(135deg, oklch(0.30 0.16 155 / 0.15), oklch(0.20 0.10 155 / 0.25))",
        border: "1px solid oklch(0.65 0.16 155 / 0.25)",
      }}
    >
      <div
        className="grid place-items-center flex-shrink-0"
        style={{ width: 40, height: 40, borderRadius: 12, background: "var(--green-soft)", color: "var(--green)" }}
      >
        <Users size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: "var(--green)" }}>Bonus de referral</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {referralUsers} fan{referralUsers !== 1 ? 's' : ''} llegaron por tu link
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-serif text-lg font-medium" style={{ color: "var(--green)" }}>+★{fmt(bonusStars)}</p>
        <p className="text-[10px] text-muted-foreground">5% de sus ventas</p>
      </div>
    </div>
  );
}

export function OnboardingCard({ profileComplete, hasContent }: { profileComplete: boolean; hasContent: boolean }) {
  const steps = [
    { done: profileComplete, label: 'Completa tu perfil', hint: 'Foto · Tagline · Descripción · Ciudad' },
    { done: hasContent,      label: 'Sube tu primer contenido', hint: 'Ve a la pestaña Fotos' },
    { done: false,           label: 'Comparte tu link con fans', hint: 'Instagram · TikTok · WhatsApp' },
  ];
  const doneCount = steps.filter(s => s.done).length;

  return (
    <div
      className="rounded-[18px] p-4"
      style={{
        background: "linear-gradient(135deg, oklch(0.55 0.18 300 / 0.10), oklch(0.45 0.20 320 / 0.08))",
        border: "1px solid var(--primary-soft)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={14} style={{ color: "oklch(0.85 0.10 300)" }} />
        <h3 className="text-xs font-semibold" style={{ color: "oklch(0.85 0.10 300)" }}>Empieza a ganar</h3>
        <span className="ml-auto text-[10px] text-muted-foreground">{doneCount}/3 completado</span>
      </div>
      <div className="h-1.5 bg-border/50 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${(doneCount / 3) * 100}%`, background: "var(--primary)" }}
        />
      </div>
      <div className="space-y-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: step.done ? "var(--green)" : "var(--border)" }}
            >
              {step.done && <Check size={11} className="text-white" />}
            </div>
            <div>
              <p className={`text-xs font-medium ${step.done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {step.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{step.hint}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
